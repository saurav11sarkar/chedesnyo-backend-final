import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { paymentController } from './payment.controller';

const router = express.Router();

router.post(
  '/assasment/:id',
  auth(userRole.business, userRole.seles),
  paymentController.createAssasmtPay,
);
router.post(
  '/assasment/approve/:id',
  auth(userRole.business),
  paymentController.approveAssasmentPayment,
);
router.post(
  '/assasment/reject/:id',
  auth(userRole.business),
  paymentController.rejectAssasmentPayment,
);

router.post(
  '/course/:id',
  auth(userRole.business, userRole.seles),
  paymentController.createCoursePay,
);
router.post(
  '/course/approve/:id',
  auth(userRole.business, userRole.seles),
  paymentController.approveCoursePayment,
);
router.post(
  '/course/reject/:id',
  auth(userRole.business, userRole.seles),
  paymentController.rejectCoursePayment,
);

// Get all payments (Admin only)
router.get('/', auth(userRole.admin), paymentController.getAllPayments);
router.get(
  '/my/all',
  auth(userRole.business, userRole.seles),
  paymentController.getMyAllPayments,
);

// Get my payments (Buyer history)
router.get(
  '/my',
  auth(userRole.business, userRole.seles),
  paymentController.getMyPayments,
);

// Get seller payments (Seller earnings)
router.get(
  '/seller/payments',
  auth(userRole.business, userRole.seles),
  paymentController.getSellerPayments,
);

// Get payment statistics
router.get(
  '/stats/dashboard',
  auth(userRole.admin, userRole.business, userRole.seles),
  paymentController.getPaymentStatistics,
);

// Get single payment
router.get(
  '/:id',
  auth(userRole.admin, userRole.business, userRole.seles),
  paymentController.getPayment,
);

export const paymentRouter = router;
