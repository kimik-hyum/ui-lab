import { notFound } from "next/navigation";
import UpgradeLogDetail from "../../../upgrade-logs/_components/UpgradeLogDetail";
import { getUpgradeLogs } from "../../../upgrade-logs/_lib/logs.server";

export const dynamic = "force-dynamic";

export default async function UpgradePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const log = (await getUpgradeLogs()).find((record) => record.id === slug);
  if (!log) notFound();
  return <UpgradeLogDetail log={log} />;
}
