import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import Assigment from '../assigment/assigment.model';
import Course from '../course/course.model';
import { userRole } from '../user/user.constant';
import User from '../user/user.model';
import { IReview } from './reviews.interface';
import Review from './reviews.model';

const createReview = async (userId: string, payload: IReview) => {
  console.log(userId);
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  const result = await Review.create({ ...payload, user: user._id });
  if (!result) throw new AppError(400, 'Review not created');

  if (result.assigment) {
    const assigment = await Assigment.findById(result.assigment);
    if (!assigment) throw new AppError(404, 'Assignment not found');
    assigment.review = assigment.review || [];
    assigment.review.push(result._id);
    await assigment.save();
  } else if (result.course) {
    const course = await Course.findById(result.course);
    if (!course) throw new AppError(404, 'Course not found');
    course.review = course.review || [];
    course.review.push(result._id);
    await course.save();
  }

  return result;
};

const getAllReviews = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = ['comment', 'status'];

  if (searchTerm) {
    andCondition.push({
      $or: userSearchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await Review.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any)
    .populate('user', 'firstName lastName email role profileImage');

  const total = await Review.countDocuments(whereCondition);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleReview = async (id: string) => {
  const result = await Review.findById(id).populate(
    'user',
    'firstName lastName email role profileImage',
  );
  return result;
};

const updateReview = async (userId: string, id: string, payload: IReview) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  const review = await Review.findById(id);
  if (!review) throw new AppError(404, 'Review not found');
  if (user.role !== userRole.admin) {
    if (user._id.toString() !== review.user.toString())
      throw new AppError(403, 'You are not authorized to update this review');
  }

  const result = await Review.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const deleteReview = async (userId: string, id: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  const review = await Review.findById(id);
  if (!review) throw new AppError(404, 'Review not found');
  if (user.role !== userRole.admin) {
    if (user._id.toString() !== review.user.toString())
      throw new AppError(403, 'You are not authorized to update this review');
  }

  if (review.assigment) {
    const assigment = await Assigment.findById(review.assigment);
    if (!assigment) throw new AppError(404, 'Assignment not found');
    assigment.review = (assigment.review || []).filter(
      (reviewId) => reviewId.toString() !== id,
    );
    await assigment.save();
  } else if (review.course) {
    const course = await Course.findById(review.course);
    if (!course) throw new AppError(404, 'Course not found');
    course.review = (course.review || []).filter(
      (reviewId) => reviewId.toString() !== id,
    );
    await course.save();
  }
  const result = await Review.findByIdAndDelete(id);

  return result;
};

export const reviewServices = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
};
