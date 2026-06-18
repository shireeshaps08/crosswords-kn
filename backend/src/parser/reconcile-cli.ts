import { processReconcile } from './reconcile';

// Pilot puzzle IDs to reconcile.  All three must have corresponding files in:
//   data/intermediate/grid/<id>.json
//   data/intermediate/clues/<id>.json
//   data/intermediate/answers/<id>.json
const PILOT_PUZZLE_IDS = [6382, 6383, 6384];

processReconcile(PILOT_PUZZLE_IDS)
  .then(() => console.log('\n[reconcile-cli] done.'))
  .catch((err) => {
    console.error('[reconcile-cli] error:', err);
    process.exit(1);
  });
