import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return callback(
      new Error('Only JPEG, PNG, and WebP images are allowed.')
    );
  }

  callback(null, true);
};

const createImageUpload = (fieldName) =>
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  }).single(fieldName);

export const uploadPostImage = createImageUpload('image');
export const uploadAvatarImage = createImageUpload('avatar');

export const uploadPostMedia = multer({
  storage,
  fileFilter: (req, file, callback) => {
    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    const isVideo = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype);
    if (!isImage && !isVideo) {
      callback(new Error('Choose JPEG, PNG, WebP images or MP4, WebM, MOV videos.'));
      return;
    }
    callback(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);