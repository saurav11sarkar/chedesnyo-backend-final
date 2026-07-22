import { Types } from 'mongoose';

export interface IPayment {
  user: Types.ObjectId;
  assigment?: Types.ObjectId;
  course?: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  stripeSessionId: string;
  stripePaymentIntentId: string;
  paymentDate: Date;
  status: 'pending' | 'approved' | 'denied' | 'refunded';
  userFree?: number;
  adminFree?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
