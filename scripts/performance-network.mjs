import http from "node:http";
import https from "node:https";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { setTimeout as delay } from "node:timers/promises";
import { createHash } from "node:crypto";

export function readNetworkProfile(value = process.env.PERF_NETWORK_PROFILE) {
  if (!value) return null;
  if (value !== "1mbps-100ms") throw new Error(`Unknown network profile: ${value}`);
  return {
    id: value,
    label: "1 Mbps · 추가 지연 100 ms",
    downloadKbps: 1000,
    uploadKbps: 1000,
    latencyMs: 100,
    cpuSlowdownMultiplier: 1,
    browserMethod: "devtools",
    ssrMethod: "http-body-proxy",
    backendMethod: "http-body-proxy",
    backend: "live-supabase",
    scope: "브라우저→앱·이미지 / SSR 도구→앱 / 앱→Supabase",
    limitation: "HTTP 요청별 본문 속도 제한과 추가 지연. 실제 Supabase 처리·인터넷 지연은 포함되며 패킷 단위의 완전한 회선 재현은 아님.",
  };
}

export function lighthouseNetworkArgs(profile) {
  if (!profile) return [];
  return [
    "--throttling-method=devtools",
    `--throttling.requestLatencyMs=${profile.latencyMs}`,
    `--throttling.downloadThroughputKbps=${profile.downloadKbps}`,
    `--throttling.uploadThroughputKbps=${profile.uploadKbps}`,
    `--throttling.cpuSlowdownMultiplier=${profile.cpuSlowdownMultiplier}`,
  ];
}

class BodyThrottle extends Transform {
  constructor(kbps) {
    super();
    this.bytesPerMs = kbps / 8;
    this.nextAt = performance.now();
  }
  _transform(chunk, _encoding, callback) {
    (async () => {
      // Small slices preserve streaming; never release an entire HTML chunk as a burst.
      for (let offset = 0; offset < chunk.length; offset += 1024) {
        if (this.destroyed) return;
        const part = chunk.subarray(offset, offset + 1024);
        this.nextAt = Math.max(performance.now(), this.nextAt) + part.length / this.bytesPerMs;
        await delay(Math.max(0, this.nextAt - performance.now()));
        if (!this.destroyed) this.push(part);
      }
    })().then(() => callback(), callback);
  }
}

/** Loopback-only, fixed-upstream HTTP proxy. No global OS/network settings are changed. */
export async function createThrottledProxy(upstreamUrl, profile) {
  const upstream = new URL(upstreamUrl);
  if (!["http:", "https:"].includes(upstream.protocol)) throw new Error("HTTP(S) upstream required");
  const stats = [];
  const sockets = new Set();
  const server = http.createServer(async (req, res) => {
    if (!["GET", "HEAD"].includes(req.method) || !req.url?.startsWith("/")) {
      res.writeHead(405).end();
      return;
    }
    const startedAt = performance.now();
    const hash = createHash("sha256");
    let bytes = 0;
    let outbound;
    let incoming;
    res.on("close", () => { outbound?.destroy(); incoming?.destroy(); });
    try {
      await delay(profile.latencyMs / 2);
      if (res.destroyed) return;
      const headers = { ...req.headers, host: upstream.host, connection: "close" };
      delete headers["proxy-connection"];
      // Concatenate with the fixed origin so an absolute request URL cannot replace the destination.
      const target = new URL(`${upstream.origin}${req.url}`);
      incoming = await new Promise((resolve, reject) => {
        outbound = (upstream.protocol === "https:" ? https : http).request(target, { method: req.method, headers }, resolve);
        outbound.setTimeout(30_000, () => outbound.destroy(new Error("Upstream timeout")));
        outbound.on("error", reject);
        req.pipe(outbound);
      });
      incoming.pause();
      incoming.on("data", (chunk) => { bytes += chunk.length; hash.update(chunk); });
      await delay(profile.latencyMs / 2);
      if (res.destroyed) return;
      const responseHeaders = { ...incoming.headers, connection: "close" };
      delete responseHeaders["transfer-encoding"];
      // Preserve the original compressed bytes and content-encoding, unlike fetch decompression.
      res.writeHead(incoming.statusCode ?? 502, responseHeaders);
      res.flushHeaders();
      await pipeline(incoming, new BodyThrottle(profile.downloadKbps), res);
      stats.push({ status: incoming.statusCode, bytes, sha256: hash.digest("hex"), elapsedMs: Math.round((performance.now() - startedAt) * 100) / 100 });
    } catch (error) {
      stats.push({ error: error.code ?? error.name, elapsedMs: Math.round(performance.now() - startedAt) });
      if (!res.headersSent) res.writeHead(502).end("Benchmark proxy failed");
      else res.destroy();
      outbound?.destroy();
      incoming?.destroy();
    }
  });
  server.on("connection", (socket) => { sockets.add(socket); socket.on("close", () => sockets.delete(socket)); });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    stats,
    close: () => new Promise((resolve, reject) => {
      for (const socket of sockets) socket.destroy();
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

export async function prepareBackendNetwork(env, profile) {
  if (!profile) return { env, stats: [], close: async () => {} };
  if (!env.SUPABASE_URL) throw new Error("Network benchmark requires SUPABASE_URL");
  const proxy = await createThrottledProxy(env.SUPABASE_URL, profile);
  return { env: { ...env, SUPABASE_URL: proxy.url }, stats: proxy.stats, close: proxy.close };
}
