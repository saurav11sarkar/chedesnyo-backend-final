import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { reviewControllers } from './reviews.controller';
const router = express.Router();

router.post(
  '/',
  auth(userRole.admin, userRole.business, userRole.seles),
  reviewControllers.createReview,
);

router.get('/', reviewControllers.getAllReviews);

router.get('/:id', reviewControllers.getSingleReview);

router.put(
  '/:id',
  auth(userRole.admin, userRole.business, userRole.seles),
  reviewControllers.updateReview,
);

router.delete(
  '/:id',
  auth(userRole.admin, userRole.business, userRole.seles),
  reviewControllers.deleteReview,
);

export const reviewRouter = router;
