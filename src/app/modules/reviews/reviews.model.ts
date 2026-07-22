import mongoose, { Schema } from 'mongoose';
import { IReview } from './reviews.interface';


const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assigment: {
      type: Schema.Types.ObjectId,
      ref: 'Assigment',
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['visible', 'hidden'],
      default: 'visible',
    },
  },
  {
    timestamps: true,
  },
);

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
