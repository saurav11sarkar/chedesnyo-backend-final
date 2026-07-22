import mongoose, { Schema } from 'mongoose';
import { IMessage } from './message.interface';

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    conversationId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    message: { type: String },
    file: { type: String },
  },
  { timestamps: true },
);

const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
