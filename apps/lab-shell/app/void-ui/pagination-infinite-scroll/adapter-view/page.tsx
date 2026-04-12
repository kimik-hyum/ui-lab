import { promises as fs } from 'fs';
import path from 'path';
import { AdapterViewInsightClientPage } from './AdapterViewInsightClientPage';

export default async function AdapterViewPage() {
  const baseDir = path.join(process.cwd(), 'app/void-ui/pagination-infinite-scroll/examples');
  const viewCode = await fs.readFile(path.join(baseDir, 'virtuoso-view-example.tsx'), 'utf8');
  const adapterCode = await fs.readFile(path.join(baseDir, 'virtuoso-adapter-example.ts'), 'utf8');

  const mergedCode = `${viewCode}\n\n// ----------------------------------------------------------------------\n// adapter implementation\n// ----------------------------------------------------------------------\n\n${adapterCode}`;

  return <AdapterViewInsightClientPage code={mergedCode} />;
}
