import mongoose from 'mongoose';
import { IBlog } from './blog.interface';

const blogSchema = new mongoose.Schema<IBlog>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Blog = mongoose.model<IBlog>('Blog', blogSchema);
export default Blog;
