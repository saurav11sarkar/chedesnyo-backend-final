import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { courseControllers } from './course.controller';
import { fileUploader } from '../../helper/fileUploder';
const router = express.Router();

router.post(
  '/',
  auth(userRole.business, userRole.seles),
  fileUploader.upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'introductionVideo', maxCount: 1 },
    { name: 'courseVideo', maxCount: 1 },
    { name: 'extraFile', maxCount: 1 },
  ]),
  courseControllers.createCourse,
);

router.get('/', courseControllers.getAllCourse);
router.get(
  '/my-course',
  auth(userRole.business, userRole.seles),
  courseControllers.getMyAllCourse,
);
router.get('/:id', courseControllers.getSingleCourse);

router.put(
  '/:id',
  auth(userRole.business, userRole.seles),
  fileUploader.upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'introductionVideo', maxCount: 1 },
    { name: 'courseVideo', maxCount: 1 },
    { name: 'extraFile', maxCount: 1 },
  ]),
  courseControllers.updateCourse,
);
router.delete(
  '/:id',
  auth(userRole.business, userRole.seles),
  courseControllers.deleteCourse,
);
router.put(
  '/:id/status',
  auth(userRole.admin),
  courseControllers.updateCourseStatus,
);

export const courseRouter = router;
