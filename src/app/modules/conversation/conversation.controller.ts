import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { conversationService } from './conversation.service';

const createConversation = catchAsync(async (req, res) => {
  const userId = req.user.id; // Logged-in user ID
  const { receiverId } = req.body; // The user to chat with

  const result = await conversationService.createConversation(userId, receiverId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Conversation created successfully',
    data: result,
  });
});

const getAllConversations = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await conversationService.getAllConversations(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Conversations retrieved successfully',
    data: result,
  });
});

export const conversationController = {
  createConversation,
  getAllConversations,
};
