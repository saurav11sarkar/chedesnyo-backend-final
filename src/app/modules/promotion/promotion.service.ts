import Stripe from 'stripe';
import config from '../../config';
import AppError from '../../error/appError';
import Promotion from './promotion.model';
import User from '../user/user.model';
import Assigment from '../assigment/assigment.model';
import Course from '../course/course.model';
import Payment from '../payment/payment.model';
import pagination, { IOption } from '../../helper/pagenation';

const stripe = new Stripe(config.stripe.secretKey!);

const PRICING: Record<number, number> = { 7: 5, 14: 9, 30: 15 };

const createPromotion = async (
  userId: string,
  body: { targetId: string; targetType: 'profile' | 'assignment' | 'course'; duration: 7 | 14 | 30 },
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  if (body.targetType === 'assignment') {
    const a = await Assigment.findById(body.targetId);
    if (!a || a.user?.toString() !== userId) throw new AppError(404, 'Assignment not found or not yours');
  } else if (body.targetType === 'course') {
    const c = await Course.findById(body.targetId);
    if (!c || c.createdBy?.toString() !== userId) throw new AppError(404, 'Course not found or not yours');
  } else if (body.targetType === 'profile') {
    if (body.targetId !== userId) throw new AppError(400, 'You can only promote your own profile');
  }

  const price = PRICING[body.duration];
  if (!price) throw new AppError(400, 'Invalid duration');

  const amount = Math.round(price * 100);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `${body.targetType} Promotion - ${body.duration} days` },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: { userId, targetId: body.targetId, targetType: body.targetType, duration: String(body.duration) },
    success_url: `${config.frontendUrl}/promotion-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/promotion-cancel`,
  });

  const promotion = await Promotion.create({
    user: userId,
    targetId: body.targetId,
    targetType: body.targetType,
    duration: body.duration,
    amountPaid: price,
    stripeSessionId: session.id,
    status: 'pending',
  });

  return { url: session.url, promotionId: promotion._id };
};

const activatePromotion = async (stripeSessionId: string) => {
  const promotion = await Promotion.findOne({ stripeSessionId });
  if (!promotion || promotion.status !== 'pending') return;

  const now = new Date();
  promotion.startDate = now;
  promotion.endDate = new Date(now.getTime() + promotion.duration * 24 * 60 * 60 * 1000);
  promotion.status = 'active';
  await promotion.save();
};

const grantFreePromotion = async (
  adminId: string,
  body: { userId: string; targetId: string; targetType: 'profile' | 'assignment' | 'course'; duration: 7 | 14 | 30 },
) => {
  const now = new Date();
  const promotion = await Promotion.create({
    user: body.userId,
    targetId: body.targetId,
    targetType: body.targetType,
    duration: body.duration,
    amountPaid: 0,
    startDate: now,
    endDate: new Date(now.getTime() + body.duration * 24 * 60 * 60 * 1000),
    status: 'active',
    isFree: true,
    grantedBy: adminId,
  });
  return promotion;
};

const getMyPromotions = async (userId: string, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const data = await Promotion.find({ user: userId })
    .skip(skip).limit(limit)
    .sort({ [sortBy]: sortOrder } as any);
  const total = await Promotion.countDocuments({ user: userId });
  return { data, meta: { total, page, limit } };
};

const getAllPromotions = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const query: any = {};
  if (params.status) query.status = params.status;
  if (params.targetType) query.targetType = params.targetType;

  const data = await Promotion.find(query)
    .populate('user', 'firstName lastName email profileImage')
    .skip(skip).limit(limit)
    .sort({ [sortBy]: sortOrder } as any);
  const total = await Promotion.countDocuments(query);
  return { data, meta: { total, page, limit } };
};

const cancelPromotion = async (promotionId: string) => {
  const promotion = await Promotion.findById(promotionId);
  if (!promotion) throw new AppError(404, 'Promotion not found');
  promotion.status = 'cancelled';
  await promotion.save();
  return promotion;
};

const trackView = async (targetId: string, targetType: string) => {
  await Promotion.updateMany(
    { targetId, targetType, status: 'active', endDate: { $gte: new Date() } },
    { $inc: { views: 1 } },
  );
};

const trackClick = async (targetId: string, targetType: string) => {
  await Promotion.updateMany(
    { targetId, targetType, status: 'active', endDate: { $gte: new Date() } },
    { $inc: { clicks: 1 } },
  );
};

const getActivePromotionIds = async (targetType: string) => {
  const now = new Date();
  const promos = await Promotion.find({
    targetType,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).select('targetId');
  return promos.map((p) => p.targetId);
};

const getPricing = () => PRICING;

export const promotionService = {
  createPromotion,
  activatePromotion,
  grantFreePromotion,
  getMyPromotions,
  getAllPromotions,
  cancelPromotion,
  trackView,
  trackClick,
  getActivePromotionIds,
  getPricing,
};
