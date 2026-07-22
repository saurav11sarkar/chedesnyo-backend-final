import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { industryController } from './industry.controller';
const router = express.Router();

router.post('/', auth(userRole.admin), industryController.createIndustry);
router.get('/', industryController.getAllIndustryes);
router.get('/:id', industryController.getSingleIndustry);
router.put('/:id', auth(userRole.admin), industryController.updateIndustry);
router.delete('/:id', auth(userRole.admin), industryController.deleteIndustry);

export const industryRouter = router;
