import pagination, { IOption } from '../../helper/pagenation';
import Assigment from '../assigment/assigment.model';
import Review from '../reviews/reviews.model';
import User from '../user/user.model';

const getLeaderboard = async (
  filter: 'weekly' | 'monthly' | 'yearly' = 'yearly',
  options: IOption,
) => {
  const { page, limit, skip } = pagination(options);

  const now = new Date();
  let startDate: Date;

  switch (filter) {
    case 'weekly':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
    default:
      startDate = new Date(now.getFullYear(), 0, 1);
  }

  const dealsData = await Assigment.aggregate([
    {
      $match: {
        workStatus: 'completed',
        workStatusUpdatedAt: { $gte: startDate, $lte: now },
        assignedFreelancer: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: '$assignedFreelancer',
        totalDeals: { $sum: 1 },
        totalEarned: { $sum: { $toDouble: '$budget' } },
      },
    },
  ]);

  const ratingsData = await Review.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: now },
        status: 'visible',
        assigment: { $exists: true },
      },
    },
    {
      $lookup: {
        from: 'assigments',
        localField: 'assigment',
        foreignField: '_id',
        as: 'assigmentDoc',
      },
    },
    { $unwind: '$assigmentDoc' },
    {
      $group: {
        _id: '$assigmentDoc.assignedFreelancer',
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const combined = dealsData.map((deal) => {
    const ratingObj = ratingsData.find(
      (r) => r._id?.toString() === deal._id?.toString(),
    );
    return {
      userId: deal._id,
      totalDeals: deal.totalDeals,
      totalEarned: deal.totalEarned,
      avgRating: ratingObj ? ratingObj.avgRating : 0,
    };
  });

  const populatedLeaderboard = await Promise.all(
    combined.map(async (item) => {
      const user = await User.findById(item.userId).select(
        'firstName lastName email profileImage industry',
      );
      return { ...item, user };
    }),
  );

  populatedLeaderboard.sort((a, b) => {
    if (b.totalDeals === a.totalDeals) return b.totalEarned - a.totalEarned;
    return b.totalDeals - a.totalDeals;
  });

  const withBadges = populatedLeaderboard.map((item, index) => {
    let badge = '';
    if (index === 0) badge = 'gold';
    else if (index <= 2) badge = 'silver';
    else if (index <= 9) badge = 'bronze';
    else badge = 'rising';

    return { ...item, rank: index + 1, badge };
  });

  const total = withBadges.length;
  const paginated = withBadges.slice(skip, skip + limit);

  return { meta: { total, page, limit }, data: paginated };
};

export const leaderboardService = { getLeaderboard };
