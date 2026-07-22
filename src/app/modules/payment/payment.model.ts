import mongoose, { Schema } from 'mongoose';
import { IPayment } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assigment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assigment',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    paymentMethod: {
      type: String,
      default: 'stripe',
    },

    // stripe fields
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },

    // meta
    paymentDate: { type: Date },

    transactionId: {
      type: String,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'refunded'],
      default: 'pending',
    },
    userFree: {
      type: Number,
      default: 0,
    },
    adminFree: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;
