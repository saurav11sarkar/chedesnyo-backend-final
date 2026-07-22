import { Types } from 'mongoose';

export interface IReview {
  user: Types.ObjectId;
  assigment?: Types.ObjectId;
  course?: Types.ObjectId;
  rating: number;
  comment: string;
  status?: 'visible' | 'hidden';
}
