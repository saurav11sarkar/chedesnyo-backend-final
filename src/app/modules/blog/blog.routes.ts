import express from 'express';
import auth from '../../middlewares/auth';
import { userRole } from '../user/user.constant';
import { blogController } from './blog.controller';
import { fileUploader } from '../../helper/fileUploder';
const router = express.Router();

router.post(
  '/',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  blogController.createBlog,
);
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getSingleBlog);
router.put(
  '/:id',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  blogController.updateBlog,
);
router.delete('/:id', auth(userRole.admin), blogController.deleteBlog);

export const blogRoutes = router;
