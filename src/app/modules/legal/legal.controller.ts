import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { legalService } from './legal.service';

const getTerms = catchAsync(async (req, res) => {
  const result = await legalService.getContent('terms');
  sendResponse(res, { statusCode: 200, success: true, message: 'Terms fetched', data: result });
});

const getPrivacy = catchAsync(async (req, res) => {
  const result = await legalService.getContent('privacy');
  sendResponse(res, { statusCode: 200, success: true, message: 'Privacy policy fetched', data: result });
});

const updateTerms = catchAsync(async (req, res) => {
  const result = await legalService.updateContent('terms', req.body.content, req.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'Terms updated', data: result });
});

const updatePrivacy = catchAsync(async (req, res) => {
  const result = await legalService.updateContent('privacy', req.body.content, req.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'Privacy policy updated', data: result });
});

const getAgreementLogs = catchAsync(async (req, res) => {
  const result = await legalService.getAgreementLogs();
  sendResponse(res, { statusCode: 200, success: true, message: 'Agreement logs fetched', data: result });
});

export const legalController = { getTerms, getPrivacy, updateTerms, updatePrivacy, getAgreementLogs };
