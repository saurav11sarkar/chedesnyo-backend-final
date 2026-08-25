import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { promotionController } from './promotion.controller';

const router = express.Router();

router.get('/pricing', promotionController.getPricing);

router.post('/', auth(userRole.business, userRole.seles), promotionController.createPromotion);
router.get('/my', auth(userRole.business, userRole.seles), promotionController.getMyPromotions);

router.get('/', auth(userRole.admin), promotionController.getAllPromotions);
router.put('/:id/cancel', auth(userRole.admin), promotionController.cancelPromotion);
router.post('/grant', auth(userRole.admin), promotionController.grantFreePromotion);

router.post('/track/view/:targetType/:targetId', promotionController.trackView);
router.post('/track/click/:targetType/:targetId', promotionController.trackClick);

export const promotionRouter = router;
