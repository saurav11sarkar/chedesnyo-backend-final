import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { invoiceController } from './invoice.controller';

const router = express.Router();

router.get('/my', auth(userRole.admin, userRole.business, userRole.seles), invoiceController.getMyInvoices);
router.get('/:paymentId/download', auth(userRole.admin, userRole.business, userRole.seles), invoiceController.downloadInvoice);

export const invoiceRouter = router;
