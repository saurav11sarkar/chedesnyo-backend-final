import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import User from '../user/user.model';
import Payout from './payout.model';
import { notificationService } from '../notification/notification.service';
import sendMailer from '../../helper/sendMailer';
import { payoutApprovedTemplate, payoutRejectedTemplate } from '../../helper/emailTemplates';

const MIN_PAYOUT_AMOUNT = 20; // minimum $20 to request payout

const requestPayout = async (
  userId: string,
  amount: number,
  method: 'iban' | 'paypal',
  accountDetails: string,
) => {
  if (amount < MIN_PAYOUT_AMOUNT)
    throw new AppError(400, `Minimum payout amount is $${MIN_PAYOUT_AMOUNT}`);

  if (!Number.isFinite(amount)) throw new AppError(400, 'Invalid payout amount');
  if (!['iban', 'paypal'].includes(method) || !accountDetails?.trim()) {
    throw new AppError(400, 'Valid payout method and account details are required');
  }

  // Atomic balance hold prevents simultaneous requests from overspending.
  const user = await User.findOneAndUpdate(
    { _id: userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true },
  );
  if (!user) throw new AppError(400, 'User not found or insufficient balance');

  let payout;
  try {
    payout = await Payout.create({
      user: userId,
      amount,
      method,
      accountDetails: accountDetails.trim(),
      status: 'pending',
    });
  } catch (error) {
    await User.findByIdAndUpdate(userId, { $inc: { balance: amount } });
    throw error;
  }

  return payout;
};

const getMyPayouts = async (userId: string, options: IOption) => {
  const { page, limit, skip } = pagination(options);
  const data = await Payout.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Payout.countDocuments({ user: userId });
  return { data, meta: { total, page, limit } };
};

const getAllPayouts = async (options: IOption) => {
  const { page, limit, skip } = pagination(options);
  const data = await Payout.find()
    .populate('user', 'firstName lastName email balance')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Payout.countDocuments();
  return { data, meta: { total, page, limit } };
};

const approvePayout = async (payoutId: string, adminNote?: string) => {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new AppError(404, 'Payout request not found');
  if (payout.status !== 'pending')
    throw new AppError(400, 'Payout already processed');

  payout.status = 'approved';
  payout.processedAt = new Date();
  if (adminNote) payout.adminNote = adminNote;
  await payout.save();

  const payoutUser = await User.findById(payout.user);
  if (payoutUser) {
    await notificationService.createNotification({
      recipient: payout.user,
      type: 'payout_approved',
      title: 'Payout Approved',
      body: `Your payout of €${payout.amount.toFixed(2)} has been approved.`,
    });
    await sendMailer(payoutUser.email, payoutUser.firstName, payoutApprovedTemplate(payoutUser.firstName, payout.amount, payout.method)).catch(() => {});
  }

  return { message: 'Payout approved successfully' };
};

const rejectPayout = async (payoutId: string, adminNote: string) => {
  const payout = await Payout.findById(payoutId).populate('user');
  if (!payout) throw new AppError(404, 'Payout request not found');
  if (payout.status !== 'pending')
    throw new AppError(400, 'Payout already processed');

  // Refund balance back to user
  const user = await User.findById(payout.user);
  if (user) {
    user.balance = (user.balance || 0) + payout.amount;
    await user.save();
  }

  payout.status = 'rejected';
  payout.processedAt = new Date();
  payout.adminNote = adminNote;
  await payout.save();

  if (user) {
    await notificationService.createNotification({
      recipient: payout.user,
      type: 'payout_rejected',
      title: 'Payout Rejected',
      body: `Your payout of €${payout.amount.toFixed(2)} has been rejected. Balance refunded.`,
    });
    await sendMailer(user.email, user.firstName, payoutRejectedTemplate(user.firstName, payout.amount)).catch(() => {});
  }

  return { message: 'Payout rejected and balance refunded' };
};

export const payoutService = {
  requestPayout,
  getMyPayouts,
  getAllPayouts,
  approvePayout,
  rejectPayout,
};
