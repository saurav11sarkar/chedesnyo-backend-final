import { Types } from 'mongoose';

export interface IPromotion {
  user: Types.ObjectId;
  targetId: Types.ObjectId;
  targetType: 'profile' | 'assignment' | 'course';
  duration: 7 | 14 | 30;
  amountPaid: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  views: number;
  clicks: number;
  isFree: boolean;
  grantedBy?: Types.ObjectId;
}
