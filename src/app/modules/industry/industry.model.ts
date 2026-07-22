import mongoose from 'mongoose';
import { IIndustry } from './industry.interface';

const industrySchema = new mongoose.Schema<IIndustry>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

const Industry = mongoose.model<IIndustry>('Industry', industrySchema);
export default Industry;
