import mongoose from 'mongoose';

export interface ILegal {
  type: 'terms' | 'privacy';
  content: string;
  updatedBy?: mongoose.Types.ObjectId;
}

const legalSchema = new mongoose.Schema<ILegal>(
  {
    type: { type: String, enum: ['terms', 'privacy'], required: true, unique: true },
    content: { type: String, required: true, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const Legal = mongoose.model<ILegal>('Legal', legalSchema);
export default Legal;
