import { Types } from 'mongoose';

export interface IMessage {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  conversationId: Types.ObjectId;
  message?: string;
  file?: string;
}
