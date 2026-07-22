import pick from '../../helper/pick';
import catchAsync from '../../utils/catchAsycn';
import sendResponse from '../../utils/sendResponse';
import { courseService } from './course.service';

const createCourse = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const files = req.files as {
    thumbnail?: Express.Multer.File[];
    introductionVideo?: Express.Multer.File[];
    courseVideo?: Express.Multer.File[];
    extraFile?: Express.Multer.File[];
  };

  const fromData = req.body.data ? JSON.parse(req.body.data) : req.body;

  const result = await courseService.createCourse(userId, fromData, files);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course created successfully',
    data: result,
  });
});

const getAllCourse = catchAsync(async (req, res) => {
  const filters = pick(req.query, [
    'searchTerm',
    'title',
    'level',
    'description',
    'targetAudience',
    'language',
    'status',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await courseService.getAllCourse(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getMyAllCourse = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const filters = pick(req.query, [
    'searchTerm',
    'title',
    'level',
    'description',
    'targetAudience',
    'language',
    'status',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await courseService.getMyAllCourse(userId, filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await courseService.getSingleCourse(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course retrieved successfully',
    data: result,
  });
});

const updateCourse = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const files = req.files as {
    thumbnail?: Express.Multer.File[];
    introductionVideo?: Express.Multer.File[];
    courseVideo?: Express.Multer.File[];
    extraFile?: Express.Multer.File[];
  };

  const formData = req.body.data ? JSON.parse(req.body.data) : req.body;

  const result = await courseService.updateCourse(userId, id, formData, files);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course updated successfully',
    data: result,
  });
});

const deleteCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const result = await courseService.deleteCourse(userId, id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course deleted successfully',
    data: result,
  });
});

const updateCourseStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await courseService.updateCourseStatus(id, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Course status updated successfully',
    data: result,
  });
});

export const courseControllers = {
  createCourse,
  getAllCourse,
  getSingleCourse,
  getMyAllCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus,
};
