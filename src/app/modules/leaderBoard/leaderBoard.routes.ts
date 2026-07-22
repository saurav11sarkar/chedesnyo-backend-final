import express from 'express';
import { leaderboardController } from './leaderBoard.controller';

const router = express.Router();

router.get('/', leaderboardController.getLeaderboard);

export const leaderBoardRouter = router;
