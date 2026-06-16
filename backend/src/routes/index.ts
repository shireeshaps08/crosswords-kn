import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth';
import * as auth from '../controllers/authController';
import * as puzzle from '../controllers/puzzleController';
import * as session from '../controllers/sessionController';
import * as leaderboard from '../controllers/leaderboardController';
import * as admin from '../controllers/adminController';

const router = Router();

const isUUID = param('id').isUUID(4);
const isPuzzleUUID = param('puzzle_id').isUUID(4);
const isSessionUUID = param('session_id').isUUID(4);
const safeLimit = query('limit').optional().isInt({ min: 1, max: 100 }).toInt();
const safePage = query('page').optional().isInt({ min: 1, max: 10000 }).toInt();

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/register',
  body('username').trim().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }),
  validate,
  auth.register
);
router.post('/auth/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().isLength({ max: 128 }),
  validate,
  auth.login
);
router.get('/auth/guest', auth.guestToken);
router.get('/auth/me', requireAuth, auth.me);

// ── Puzzles ───────────────────────────────────────────────────────────────────
router.get('/puzzles',
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  safeLimit,
  safePage,
  validate,
  puzzle.listPuzzles
);
router.get('/puzzles/:id', isUUID, validate, puzzle.getPuzzle);
router.post('/puzzles', requireAdmin, puzzle.createPuzzle);

// ── Sessions ──────────────────────────────────────────────────────────────────
router.post('/puzzles/:puzzle_id/sessions', isPuzzleUUID, validate, optionalAuth, session.startSession);
router.patch('/sessions/:session_id',
  isSessionUUID,
  body('cell_updates').isArray({ min: 1, max: 100 }),
  body('cell_updates.*.row').isInt({ min: 0, max: 99 }),
  body('cell_updates.*.col').isInt({ min: 0, max: 99 }),
  body('cell_updates.*.value').isString().isLength({ max: 10 }),
  validate,
  optionalAuth,
  session.updateSession
);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/puzzles', requireAdmin, admin.listAllPuzzles);
router.delete('/admin/puzzles/:id', isUUID, validate, requireAdmin, admin.deletePuzzle);
router.patch('/admin/puzzles/:id/publish', isUUID, validate, requireAdmin, admin.togglePublish);

// ── Leaderboard ───────────────────────────────────────────────────────────────
router.get('/puzzles/:puzzle_id/leaderboard',
  isPuzzleUUID, safeLimit, validate,
  leaderboard.getLeaderboard
);
router.get('/leaderboard', safeLimit, validate, leaderboard.getGlobalLeaderboard);

// ── User stats (persists across sessions / logins) ────────────────────────────
router.get('/users/me/stats', requireAuth, leaderboard.getUserStats);

export default router;
