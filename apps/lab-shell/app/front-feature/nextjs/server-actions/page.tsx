import { promises as fs } from "node:fs";
import path from "node:path";
import { ServerActionsClientPage } from "./ServerActionsClientPage";

export const runtime = "nodejs";

export default async function ServerActionsPage() {
  const directory = path.join(process.cwd(), "app/front-feature/nextjs/server-actions");
  const [apiForm, actionForm, request, action, validation, route] = await Promise.all([
    fs.readFile(path.join(directory, "components/ApiNameForm.tsx"), "utf8"),
    fs.readFile(path.join(directory, "components/ServerActionNameForm.tsx"), "utf8"),
    fs.readFile(path.join(directory, "request-name.ts"), "utf8"),
    fs.readFile(path.join(directory, "actions.ts"), "utf8"),
    fs.readFile(path.join(directory, "verify-name.server.ts"), "utf8"),
    fs.readFile(path.join(process.cwd(), "app/api/server-action-demo/route.ts"), "utf8"),
  ]);
  return <ServerActionsClientPage
    apiCode={`// components/ApiNameForm.tsx\n${apiForm}\n// request-name.ts\n${request}\n// app/api/server-action-demo/route.ts\n${route}\n// verify-name.server.ts\n${validation}`}
    actionCode={`// components/ServerActionNameForm.tsx\n${actionForm}\n// actions.ts\n${action}\n// verify-name.server.ts\n${validation}`}
  />;
}
