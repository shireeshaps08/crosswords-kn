import * as path from 'path';
import { ingest } from './ingest';

const [, , inputArg] = process.argv;

if (!inputArg) {
  console.error('Usage: ts-node src/parser/ingest-cli.ts <path-to-docx>');
  process.exit(1);
}

const sourcePath = path.resolve(process.cwd(), inputArg);

ingest(sourcePath)
  .then((out) => {
    console.log(`[ingest-cli] done. JSON at: ${out}`);
  })
  .catch((err) => {
    console.error('[ingest-cli] error:', err);
    process.exit(1);
  });
