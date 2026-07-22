import mongoose, { Schema } from 'mongoose';
import { IConversation } from './conversation.interface';

const conversationSchema = new Schema<IConversation>(
  {
    members: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

const Conversation = mongoose.model<IConversation>(
  'Conversation',
  conversationSchema,
);
export default Conversation;
