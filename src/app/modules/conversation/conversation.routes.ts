import express from 'express';
import { conversationController } from './conversation.controller';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';

const router = express.Router();

// 🔹 Create conversation between logged-in user and receiver
router.post(
  '/',
  auth(userRole.business, userRole.seles),
  conversationController.createConversation,
);

// 🔹 Get all conversations of logged-in user
router.get(
  '/',
  auth(userRole.business, userRole.seles),
  conversationController.getAllConversations,
);

export const conversationRoutes = router;
