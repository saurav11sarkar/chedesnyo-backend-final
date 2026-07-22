import AppError from '../../error/appError';
import pagination, { IOption } from '../../helper/pagenation';
import { IIndustry } from './industry.interface';
import Industry from './industry.model';

const createIndustry = async (payload: IIndustry) => {
  const result = await Industry.create(payload);
  if (!result) throw new AppError(400, 'Industry is not create');
  return result;
};

const getAllIndustryes = async (params: any, options: IOption) => {
  const { page, limit, skip, sortBy, sortOrder } = pagination(options);
  const { searchTerm, ...filterData } = params;

  const andCondition: any[] = [];
  const userSearchableFields = ['name'];

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

  const result = await Industry.find(whereCondition)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder } as any);

  const total = await Industry.countDocuments(whereCondition);

  return {
    data: result,
    meta: {
      total,
      page,
      limit,
    },
  };
};

const getSingleIndustry = async (id: string) => {
  const result = await Industry.findById(id);
  if (!result) throw new AppError(400, 'Industry is not found');
  return result;
};

const updateIndustry = async (id: string, payload: Partial<IIndustry>) => {
  const result = await Industry.findByIdAndUpdate(id, payload, { new: true });
  if (!result) throw new AppError(400, 'Industry is not update');
  return result;
};

const deleteIndustry = async (id: string) => {
  const result = await Industry.findByIdAndDelete(id);
  if (!result) throw new AppError(400, 'Industry is not delete');
  return result;
};

export const industryService = {
  createIndustry,
  getAllIndustryes,
  getSingleIndustry,
  updateIndustry,
  deleteIndustry,
};
