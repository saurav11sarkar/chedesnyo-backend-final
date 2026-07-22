import mongoose from 'mongoose';
import { IPromotion } from './promotion.interface';

const promotionSchema = new mongoose.Schema<IPromotion>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: {
      type: String,
      enum: ['profile', 'assignment', 'course'],
      required: true,
    },
    duration: { type: Number, enum: [7, 14, 30], required: true },
    amountPaid: { type: Number, required: true },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending',
    },
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const Promotion = mongoose.model<IPromotion>('Promotion', promotionSchema);
export default Promotion;
