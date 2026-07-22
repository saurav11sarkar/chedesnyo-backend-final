import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import { leaderboardService } from './leaderBord.service';

const getLeaderboard = catchAsync(async (req, res) => {
  const { filter } = req.query;
  const period = (filter as string) || 'yearly';
  const options = pick(req.query, ['sortBy', 'sortOrder', 'page', 'limit']);
  const data = await leaderboardService.getLeaderboard(
    period as 'weekly' | 'monthly' | 'yearly',
    options,
  );

  res.status(200).json({
    success: true,
    message: `Leaderboard fetched successfully (${period})`,
    data,
  });
});

export const leaderboardController = {
  getLeaderboard,
};
