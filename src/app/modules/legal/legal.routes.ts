import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { legalController } from './legal.controller';

const router = express.Router();

router.get('/terms', legalController.getTerms);
router.get('/privacy', legalController.getPrivacy);
router.put('/terms', auth(userRole.admin), legalController.updateTerms);
router.put('/privacy', auth(userRole.admin), legalController.updatePrivacy);
router.get('/agreement-logs', auth(userRole.admin), legalController.getAgreementLogs);

export const legalRouter = router;
