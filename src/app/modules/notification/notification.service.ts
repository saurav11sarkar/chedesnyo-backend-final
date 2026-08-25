import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import Notification from './notification.model';
import { NotificationType } from './notification.interface';
import { Types } from 'mongoose';

// Internal helper — trigger a notification from any service
const createNotification = async (data: {
  recipient: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  relatedId?: string | Types.ObjectId;
}) => {
  return Notification.create(data);
};

const getMyNotifications = async (userId: string, options: IOption) => {
  const { page, limit, skip } = pagination(options);

  const result = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({ recipient: userId });
  const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

  return {
    data: result,
    meta: { total, unreadCount, page, limit },
  };
};

const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) throw new AppError(404, 'Notification not found');
  if (notification.recipient.toString() !== userId)
    throw new AppError(403, 'Not authorized');

  notification.isRead = true;
  await notification.save();
  return notification;
};

const markAllAsRead = async (userId: string) => {
  await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  return { message: 'All notifications marked as read' };
};

const deleteNotification = async (notificationId: string, userId: string) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) throw new AppError(404, 'Notification not found');
  if (notification.recipient.toString() !== userId)
    throw new AppError(403, 'Not authorized');

  await Notification.findByIdAndDelete(notificationId);
  return { message: 'Notification deleted' };
};

const adminSendNotification = async (data: {
  recipientIds: string[];
  title: string;
  body: string;
  link?: string;
}) => {
  const notifications = data.recipientIds.map((id) => ({
    recipient: id,
    type: 'general' as NotificationType,
    title: data.title,
    body: data.body,
    link: data.link,
  }));
  return Notification.insertMany(notifications);
};

export const notificationService = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  adminSendNotification,
};
