import type { Metadata } from "next";
import { notFound } from "next/navigation";
import UpgradeLogDetail from "../_components/UpgradeLogDetail";
import { getUpgradeLogs } from "../_lib/logs.server";

export const metadata: Metadata = { title: "버전업 기록 | UI-LAB" };
export const dynamic = "force-dynamic";

export default async function UpgradeLogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const log = (await getUpgradeLogs()).find((record) => record.id === slug);
  if (!log) notFound();
  return <UpgradeLogDetail log={log} />;
}
