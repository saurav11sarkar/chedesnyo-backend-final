import { fileUploader } from '../../helper/fileUploder';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { messageService } from './message.service';

const createMessage = catchAsync(async (req, res) => {
  const userId = req.user.id;

  let fileUrl: string | undefined;
  if (req.file) {
    const uploaded = await fileUploader.uploadToCloudinary(req.file);
    fileUrl = uploaded.secure_url;
  }

  const result = await messageService.createMessage(userId, {
    ...req.body,
    file: fileUrl,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Message sent successfully',
    data: result,
  });
});

const getMessages = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;
  const result = await messageService.getMessagesByConversation(
    userId,
    conversationId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  });
});

const updateMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await messageService.updateMessage(userId, id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message updated successfully',
    data: result,
  });
});

const deleteMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  await messageService.deleteMessage(userId, id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message deleted successfully',
  });
});

export const messageController = {
  createMessage,
  getMessages,
  updateMessage,
  deleteMessage,
};
