import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import pick from '../../helper/pick';
import { promotionService } from './promotion.service';

const createPromotion = catchAsync(async (req, res) => {
  const result = await promotionService.createPromotion(req.user.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: 'Promotion checkout created', data: result });
});

const getMyPromotions = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'sortOrder', 'page', 'limit']);
  const result = await promotionService.getMyPromotions(req.user.id, options);
  sendResponse(res, { statusCode: 200, success: true, message: 'Promotions fetched', data: result });
});

const getAllPromotions = catchAsync(async (req, res) => {
  const params = pick(req.query, ['status', 'targetType']);
  const options = pick(req.query, ['sortBy', 'sortOrder', 'page', 'limit']);
  const result = await promotionService.getAllPromotions(params, options);
  sendResponse(res, { statusCode: 200, success: true, message: 'All promotions fetched', data: result });
});

const cancelPromotion = catchAsync(async (req, res) => {
  const result = await promotionService.cancelPromotion(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'Promotion cancelled', data: result });
});

const grantFreePromotion = catchAsync(async (req, res) => {
  const result = await promotionService.grantFreePromotion(req.user.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: 'Free promotion granted', data: result });
});

const trackView = catchAsync(async (req, res) => {
  await promotionService.trackView(req.params.targetId, req.params.targetType);
  sendResponse(res, { statusCode: 200, success: true, message: 'View tracked', data: null });
});

const trackClick = catchAsync(async (req, res) => {
  await promotionService.trackClick(req.params.targetId, req.params.targetType);
  sendResponse(res, { statusCode: 200, success: true, message: 'Click tracked', data: null });
});

const getPricing = catchAsync(async (req, res) => {
  const result = promotionService.getPricing();
  sendResponse(res, { statusCode: 200, success: true, message: 'Pricing fetched', data: result });
});

export const promotionController = {
  createPromotion,
  getMyPromotions,
  getAllPromotions,
  cancelPromotion,
  grantFreePromotion,
  trackView,
  trackClick,
  getPricing,
};
