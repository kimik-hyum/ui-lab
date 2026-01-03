import { promises as fs } from 'fs';
import path from 'path';
import {ClientPage} from './ClientPage';

export default async function Page() {
  // Read source code from the file system
  const appDir = path.join(process.cwd(), 'app/benchmark/optimistic/components');
  
  const traditionalCode = await fs.readFile(path.join(appDir, 'TraditionalList.tsx'), 'utf8');
  const optimisticCode = await fs.readFile(path.join(appDir, 'OptimisticList.tsx'), 'utf8');

  return (
    <ClientPage 
      traditionalCode={traditionalCode} 
      optimisticCode={optimisticCode} 
    />
  );
}
