import { processAssemble } from './assemble';

const PILOT_PUZZLE_IDS = [6382, 6383, 6384];

processAssemble(PILOT_PUZZLE_IDS)
  .then(() => console.log('\n[assemble-cli] done.'))
  .catch((err) => {
    console.error('[assemble-cli] error:', err);
    process.exit(1);
  });
