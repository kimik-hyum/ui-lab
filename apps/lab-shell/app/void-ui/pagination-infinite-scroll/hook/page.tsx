import { promises as fs } from 'fs';
import path from 'path';
import { HookInsightClientPage } from './HookInsightClientPage';

export default async function PaginationInfiniteHookPage() {
  const hookPath = path.join(
    process.cwd(),
    'app/void-ui/pagination-infinite-scroll/useHybridInfinite.ts',
  );
  const hookCode = await fs.readFile(hookPath, 'utf8');

  return <HookInsightClientPage hookCode={hookCode} />;
}
