import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { industryService } from './industry.service';

const createIndustry = catchAsync(async (req, res) => {
  const result = await industryService.createIndustry(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Industry created successfully',
    data: result,
  });
});

const getAllIndustryes = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['searchTerm', 'name']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await industryService.getAllIndustryes(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Industryes fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleIndustry = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await industryService.getSingleIndustry(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Industry fetched successfully',
    data: result,
  });
});

const updateIndustry = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await industryService.updateIndustry(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Industry updated successfully',
    data: result,
  });
});

const deleteIndustry = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await industryService.deleteIndustry(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Industry deleted successfully',
    data: result,
  });
});

export const industryController = {
  createIndustry,
  getAllIndustryes,
  getSingleIndustry,
  updateIndustry,
  deleteIndustry,
};
