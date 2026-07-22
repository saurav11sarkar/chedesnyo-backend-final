import Conversation from './conversation.model';
import AppError from '../../error/appError';


const createConversation = async (userId: string, receiverId: string) => {
  if (userId === receiverId) {
    throw new AppError(400, "You can't create a conversation with yourself");
  }

  // Check if conversation already exists
  const existing = await Conversation.findOne({
    members: { $all: [userId, receiverId] },
  });

  if (existing) {
    return existing;
  }

  const conversation = await Conversation.create({
    members: [userId, receiverId],
  });

  return conversation;
};

const getAllConversations = async (userId: string) => {
  // Return all conversations where current user is a member
  const conversations = await Conversation.find({
    members: { $in: [userId] },
  }).populate('members', 'firstName lastName email profileImage role');

  return conversations;
};

export const conversationService = {
  createConversation,
  getAllConversations,
};
