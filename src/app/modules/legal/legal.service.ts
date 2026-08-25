import Legal from './legal.model';
import User from '../user/user.model';
import AppError from '../../error/appError';

const getContent = async (type: 'terms' | 'privacy') => {
  let doc = await Legal.findOne({ type });
  if (!doc) {
    doc = await Legal.create({ type, content: type === 'terms' ? 'Terms of Service - Coming soon.' : 'Privacy Policy - Coming soon.' });
  }
  return doc;
};

const updateContent = async (type: 'terms' | 'privacy', content: string, adminId: string) => {
  let doc = await Legal.findOne({ type });
  if (!doc) {
    doc = await Legal.create({ type, content, updatedBy: adminId });
  } else {
    doc.content = content;
    doc.updatedBy = adminId as any;
    await doc.save();
  }
  return doc;
};

const getAgreementLogs = async () => {
  const users = await User.find({ tosAcceptedAt: { $exists: true, $ne: null } })
    .select('firstName lastName email tosAcceptedAt tosIp role')
    .sort({ tosAcceptedAt: -1 });
  return users;
};

export const legalService = { getContent, updateContent, getAgreementLogs };
