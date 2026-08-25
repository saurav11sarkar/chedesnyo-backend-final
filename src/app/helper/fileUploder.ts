import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { ICloudinaryResponse } from '../interface';
import AppError from '../error/appError';
import config from '../config';

cloudinary.config({
  cloud_name: config.cloudinary.name,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Sanitize filename function
const sanitizeFileName = (originalName: string) => {
  return originalName
    .replace(/\s+/g, '_') // space → underscore
    .replace(/[^a-zA-Z0-9._-]/g, '') // remove special chars
    .toLowerCase();
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDirectory = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(uploadDirectory, { recursive: true });
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const safeName = Date.now() + '-' + sanitizeFileName(file.originalname);
    cb(null, safeName);
  },
});

// Multer instance (image + video support)
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = new Set(['.jpeg', '.jpg', '.png', '.gif', '.mp4', '.mov', '.pdf', '.avi', '.mkv']);
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'application/pdf']);
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.has(ext) && allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Unsupported file type'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024, files: 4 },
});

const uploadToCloudinary = async (
  file: Express.Multer.File,
): Promise<ICloudinaryResponse> => {
  return new Promise<ICloudinaryResponse>((resolve, reject) => {
    const safeName = sanitizeFileName(file.originalname);

    // Detect resource type
    const ext = path.extname(file.originalname).toLowerCase();
    const isVideo = /mp4|mov|avi|mkv/.test(ext);

    cloudinary.uploader.upload(
      file.path,
      {
        public_id: safeName,
        folder: 'File_Uploader',
        resource_type: isVideo ? 'video' : 'image',
        ...(isVideo
          ? {} // no transformation for video by default
          : { transformation: { width: 500, height: 500, crop: 'limit' } }),
      },
      (error, result) => {
        fs.unlink(file.path, () => undefined);
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result as ICloudinaryResponse);
        } else {
          reject(
            new AppError(
              400,
              'Upload failed: No result returned from Cloudinary',
            ),
          );
        }
      },
    );
  });
};

export const fileUploader = {
  upload,
  uploadToCloudinary,
};
