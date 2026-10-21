import type { Metadata } from "next";
import UpgradeLogList from "./_components/UpgradeLogList";
import { getUpgradeLogs } from "./_lib/logs.server";

export const metadata: Metadata = { title: "버전업 로그 | UI-LAB" };
// Read the record at request time so edited change notes appear without a new build.
export const dynamic = "force-dynamic";

export default async function UpgradeLogsPage() {
  return <UpgradeLogList logs={await getUpgradeLogs()} />;
}
