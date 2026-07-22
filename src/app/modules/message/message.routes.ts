import express from 'express';
import { messageController } from './message.controller';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { fileUploader } from '../../helper/fileUploder';

const router = express.Router();

router.post(
  '/',
  auth(userRole.business, userRole.seles),
  fileUploader.upload.single('file'),
  messageController.createMessage,
);

router.get(
  '/:conversationId',
  auth(userRole.business, userRole.seles),
  messageController.getMessages,
);

router.put(
  '/:id',
  auth(userRole.business, userRole.seles),
  messageController.updateMessage,
);

router.delete(
  '/:id',
  auth(userRole.business, userRole.seles),
  messageController.deleteMessage,
);

export const messageRoutes = router;
