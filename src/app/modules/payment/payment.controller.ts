import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { paymentService } from './payment.service';

const createAssasmtPay = catchAsync(async (req, res) => {
  const result = await paymentService.createAssasmtPay(
    req.user.id,
    req.params.id,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment initiated',
    data: result,
  });
});

const approveAssasmentPayment = catchAsync(async (req, res) => {
  const result = await paymentService.approveAssasmentPayment(
    req.params.id,
    req.user.id,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment approved',
    data: result,
  });
});

const rejectAssasmentPayment = catchAsync(async (req, res) => {
  const result = await paymentService.rejectAssasmentPayment(
    req.params.id,
    req.user.id,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment rejected',
    data: result,
  });
});

const createCoursePay = catchAsync(async (req, res) => {
  const result = await paymentService.createCoursePay(
    req.user.id,
    req.params.id,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course payment initiated',
    data: result,
  });
});

const approveCoursePayment = catchAsync(async (req, res) => {
  const result = await paymentService.approveCoursePayment(
    req.params.id,
    req.user.id,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course payment approved',
    data: result,
  });
});

const rejectCoursePayment = catchAsync(async (req, res) => {
  const result = await paymentService.rejectCoursePayment(
    req.params.id,
    req.user.id,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course payment rejected',
    data: result,
  });
});

// Get all payments (Admin)
const getAllPayments = catchAsync(async (req, res) => {
  const filters = pick(req.query, [
    'status',
    'paymentMethod',
    'minAmount',
    'maxAmount',
    'searchTerm',
  ]);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await paymentService.allPayments(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payments retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});
// Get all payments (Admin)
const getMyAllPayments = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await paymentService.getMyAllPayments(userId, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payments retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

// Get single payment
const getPayment = catchAsync(async (req, res) => {
  const result = await paymentService.getPaymentById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment retrieved successfully',
    data: result,
  });
});

// Get user's payments (Buyer history)
const getMyPayments = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['searchTerm']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await paymentService.getPaymentsByUser(
    req.user.id,
    filters,
    options,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Your payments retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

// Get seller's payments (Seller earnings)
const getSellerPayments = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['searchTerm', 'type']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await paymentService.getPaymentsForSeller(
    req.user.id,
    filters,
    options,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Seller payments retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

// Get payment statistics
const getPaymentStatistics = catchAsync(async (req, res) => {
  const result = await paymentService.getPaymentStats(
    req.user.id,
    req.user.role,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment statistics retrieved successfully',
    data: result,
  });
});

export const paymentController = {
  createAssasmtPay,
  approveAssasmentPayment,
  rejectAssasmentPayment,
  createCoursePay,
  approveCoursePayment,
  rejectCoursePayment,

  getAllPayments,
  getPayment,
  getMyPayments,
  getSellerPayments,
  getPaymentStatistics,
  getMyAllPayments,
};
