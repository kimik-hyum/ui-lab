import { NextRequest, NextResponse } from "next/server";

function compareVersion(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function GET(req: NextRequest) {
  const pkg = req.nextUrl.searchParams.get("pkg");
  if (!pkg) return NextResponse.json({ error: "pkg required" }, { status: 400 });

  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // 1시간 캐시
    });

    if (!res.ok) throw new Error(`npm registry ${res.status}`);

    const data = await res.json();
    const allVersions: string[] = Object.keys(data.versions ?? {});

    // 프리릴리즈 제거, major별 최신 patch만 유지
    const majorMap = new Map<number, string>();
    for (const v of allVersions) {
      if (/-/.test(v)) continue;
      const major = parseInt(v.split(".")[0]);
      if (isNaN(major) || major < 1) continue;
      const existing = majorMap.get(major);
      if (!existing || compareVersion(v, existing) > 0) {
        majorMap.set(major, v);
      }
    }

    const versions = Array.from(majorMap.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, 10)
      .map(([major, version]) => ({ major, version }));

    return NextResponse.json({ versions, latest: data["dist-tags"]?.latest ?? null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
