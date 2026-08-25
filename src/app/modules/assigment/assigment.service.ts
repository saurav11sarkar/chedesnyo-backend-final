import AppError from '../../error/appError';
import { fileUploader } from '../../helper/fileUploder';
import pagination, { IOption } from '../../helper/pagenation';
import User from '../user/user.model';
import { IAssigment } from './assigment.interface';
import Assigment from './assigment.model';
import { notificationService } from '../notification/notification.service';
import sendMailer from '../../helper/sendMailer';
import { applicationReceivedTemplate, applicantAcceptedTemplate } from '../../helper/emailTemplates';

const createAssigment = async (
  userId: string,
  payload: IAssigment,
  files?: {
    banner?: Express.Multer.File[];
    uploadFile?: Express.Multer.File[];
  },
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  if (!files?.banner || files.banner.length === 0) {
    throw new AppError(400, 'Banner file is required');
  }

  const bannerUpload = await fileUploader.uploadToCloudinary(files.banner[0]);
  payload.banner = bannerUpload.secure_url;

  if (files.uploadFile && files.uploadFile.length > 0) {
    const uploadFileRes = await fileUploader.uploadToCloudinary(
      files.uploadFile[0],
    );
    payload.uploadFile = uploadFileRes.secure_url;
  }

  const result = await Assigment.create({
    ...payload,
    user: user._id,
  });

  return result;
};

const getAllAssigments = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, priceType, isPublic, minBudget, maxBudget, workStatus, ...filterData } = params;

  const andCondition: any[] = [];
  const searchableFields = ['title', 'description'];

  if (searchTerm) {
    andCondition.push({
      $or: searchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    });
  }

  if (priceType) andCondition.push({ priceType });
  if (isPublic !== undefined) andCondition.push({ isPublic: isPublic === 'true' });
  if (workStatus) andCondition.push({ workStatus });
  if (minBudget) andCondition.push({ budget: { $gte: minBudget } });
  if (maxBudget) andCondition.push({ budget: { $lte: maxBudget } });

  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  // Prioritize promoted assignments
  const Promotion = (await import('../promotion/promotion.model')).default;
  const promotedIds = await Promotion.find({
    targetType: 'assignment', status: 'active', startDate: { $lte: new Date() }, endDate: { $gte: new Date() },
  }).select('targetId');
  const promotedSet = new Set(promotedIds.map((p) => p.targetId.toString()));

  const result = await Assigment.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any)
    .populate('user', 'firstName lastName email role profileImage');

  const sorted = result.sort((a, b) => {
    const aPromoted = promotedSet.has(a._id.toString()) ? 1 : 0;
    const bPromoted = promotedSet.has(b._id.toString()) ? 1 : 0;
    return bPromoted - aPromoted;
  });

  const total = await Assigment.countDocuments(whereCondition);

  return {
    data: sorted,
    meta: { total, page, limit },
  };
};

const getSingleAssigment = async (id: string) => {

  const result = await Assigment.findById(id).populate(
    'user',
    'firstName lastName email role profileImage',
  ).populate({
      path: 'review', // populate the review array
      select: 'rating comment createdAt', // fields from review
      populate: {
        path: 'user', // nested populate to get user info for each review
        select: 'firstName lastName profileImage',
      },
    });
  if (!result) throw new AppError(404, 'Assignment not found');
  return result;
};

const myAllAssigments = async (
  userId: string,
  params: any,
  options: IOption,
) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = [
    'title',
    'description',
    'budget',
    'priceType',
    'paymentMethod',
    'status',
  ];

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

  const result = await Assigment.find({ ...whereCondition, user: userId })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any)
    .populate('user', 'firstName lastName email role profileImage');

  const total = await Assigment.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const updateAssigment = async (
  userId: string,
  id: string,
  payload: Partial<IAssigment>,
  files?: {
    banner?: Express.Multer.File[];
    uploadFile?: Express.Multer.File[];
  },
) => {
  const assigment = await Assigment.findById(id);
  if (!assigment) {
    throw new AppError(404, 'Assignment not found');
  }

  // Only owner or admin can update
  if (assigment.user?.toString() !== userId.toString()) {
    throw new AppError(403, 'You are not authorized to update this assignment');
  }

  // Handle banner file upload if provided
  if (files?.banner && files.banner.length > 0) {
    const bannerUpload = await fileUploader.uploadToCloudinary(files.banner[0]);
    payload.banner = bannerUpload.secure_url;
  }

  // Handle other uploadFile if provided
  if (files?.uploadFile && files.uploadFile.length > 0) {
    const uploadFileRes = await fileUploader.uploadToCloudinary(
      files.uploadFile[0],
    );
    payload.uploadFile = uploadFileRes.secure_url;
  }

  const updated = await Assigment.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updated;
};

const deleteAssigment = async (userId: string, id: string) => {
  const assigment = await Assigment.findById(id);
  if (!assigment) {
    throw new AppError(404, 'Assignment not found');
  }
  if (assigment.user?.toString() !== userId.toString()) {
    throw new AppError(403, 'You are not authorized to delete this assignment');
  }
  const deleted = await Assigment.findByIdAndDelete(id);
  return deleted;
};

const updateStatus = async (id: string, status: string) => {
  const assigment = await Assigment.findById(id);
  if (!assigment) {
    throw new AppError(404, 'Assignment not found');
  }
  const updated = await Assigment.findByIdAndUpdate(
    id,
    { status },
    {
      new: true,
      runValidators: true,
    },
  );

  return updated;
};

// Freelancer applies for a job
const applyForAssignment = async (assignmentId: string, freelancerId: string) => {
  const assignment = await Assigment.findById(assignmentId);
  if (!assignment) throw new AppError(404, 'Assignment not found');
  if (assignment.status !== 'approved')
    throw new AppError(400, 'This assignment is not open for applications');
  if (assignment.user?.toString() === freelancerId)
    throw new AppError(400, 'You cannot apply for your own assignment');

  const alreadyApplied = assignment.application?.some(
    (id) => id.toString() === freelancerId,
  );
  if (alreadyApplied) throw new AppError(400, 'You have already applied');

  assignment.application = [...(assignment.application || []), freelancerId as any];
  await assignment.save();

  const freelancer = await User.findById(freelancerId);
  const owner = await User.findById(assignment.user);
  if (owner) {
    await notificationService.createNotification({
      recipient: assignment.user!,
      type: 'assignment_applied',
      title: 'New Application',
      body: `${freelancer?.firstName || 'A freelancer'} applied for "${assignment.title}"`,
      relatedId: assignment._id as any,
    });
    await sendMailer(owner.email, owner.firstName, applicationReceivedTemplate(owner.firstName, assignment.title, freelancer?.firstName || 'A freelancer')).catch(() => {});
  }

  return { message: 'Application submitted successfully' };
};

// Company views all applicants for their assignment
const getApplicants = async (assignmentId: string, ownerId: string) => {
  const assignment = await Assigment.findById(assignmentId).populate(
    'application',
    'firstName lastName email profileImage role location specialties overviewExperience',
  );
  if (!assignment) throw new AppError(404, 'Assignment not found');
  if (assignment.user?.toString() !== ownerId)
    throw new AppError(403, 'You are not authorized to view applicants');

  return assignment.application;
};

// Company accepts a freelancer's application
const acceptApplicant = async (
  assignmentId: string,
  freelancerId: string,
  ownerId: string,
) => {
  const assignment = await Assigment.findById(assignmentId);
  if (!assignment) throw new AppError(404, 'Assignment not found');
  if (assignment.user?.toString() !== ownerId)
    throw new AppError(403, 'Not authorized');

  const applied = assignment.application?.some(
    (id) => id.toString() === freelancerId,
  );
  if (!applied) throw new AppError(400, 'This freelancer has not applied');

  assignment.assignedFreelancer = freelancerId as any;
  await assignment.save();

  const acceptedFreelancer = await User.findById(freelancerId);
  if (acceptedFreelancer) {
    await notificationService.createNotification({
      recipient: freelancerId,
      type: 'applicant_accepted',
      title: 'Application Accepted!',
      body: `Your application for "${assignment.title}" has been accepted.`,
      relatedId: assignment._id as any,
    });
    await sendMailer(acceptedFreelancer.email, acceptedFreelancer.firstName, applicantAcceptedTemplate(acceptedFreelancer.firstName, assignment.title)).catch(() => {});
  }

  return { message: 'Applicant accepted. Proceed to payment to hire.' };
};

// Company rejects a freelancer's application
const rejectApplicant = async (
  assignmentId: string,
  freelancerId: string,
  ownerId: string,
) => {
  const assignment = await Assigment.findById(assignmentId);
  if (!assignment) throw new AppError(404, 'Assignment not found');
  if (assignment.user?.toString() !== ownerId)
    throw new AppError(403, 'Not authorized');

  assignment.application = (assignment.application || []).filter(
    (id) => id.toString() !== freelancerId,
  );
  await assignment.save();

  return { message: 'Applicant rejected' };
};

// Update work status — company or assigned freelancer can update
const updateWorkStatus = async (
  assignmentId: string,
  userId: string,
  workStatus: 'in-progress' | 'completed' | 'cancelled' | 'disputed',
) => {
  const assignment = await Assigment.findById(assignmentId);
  if (!assignment) throw new AppError(404, 'Assignment not found');

  const isOwner = assignment.user?.toString() === userId;
  const isFreelancer = assignment.assignedFreelancer?.toString() === userId;

  if (!isOwner && !isFreelancer)
    throw new AppError(403, 'Not authorized to update work status');

  if (assignment.status !== 'approved')
    throw new AppError(400, 'Assignment must be approved before updating work status');

  const validTransitions: Record<string, string[]> = {
    'not-started': ['in-progress', 'cancelled'],
    'in-progress': ['completed', 'cancelled', 'disputed'],
    'completed': [],
    'cancelled': [],
    'disputed': ['completed', 'cancelled'],
  };

  const current = assignment.workStatus || 'not-started';
  if (!validTransitions[current]?.includes(workStatus)) {
    throw new AppError(400, `Cannot transition from "${current}" to "${workStatus}"`);
  }

  assignment.workStatus = workStatus;
  assignment.workStatusUpdatedAt = new Date();

  if (workStatus === 'in-progress' && !assignment.assignedFreelancer) {
    assignment.assignedFreelancer = userId as any;
  }

  await assignment.save();
  return assignment;
};

export const assigmentService = {
  createAssigment,
  updateAssigment,
  deleteAssigment,
  updateStatus,
  getAllAssigments,
  getSingleAssigment,
  myAllAssigments,
  applyForAssignment,
  getApplicants,
  acceptApplicant,
  rejectApplicant,
  updateWorkStatus,
};
