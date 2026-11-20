import multer from 'multer';
import path from 'path';

const allowedMimeTypes = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/csv',
  'application/pdf',
  'application/x-pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/tiff',
];

const allowedExtensions = ['.csv', '.pdf', '.xlsx', '.xls', '.png', '.jpg', '.jpeg'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    const error = new Error('Invalid file extension. Allowed formats: PDF, CSV, Excel (.xlsx, .xls), and scanned images.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  cb(null, true);
};

const maxMb = parseInt(process.env.MAX_UPLOAD_MB || '25', 10);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxMb * 1024 * 1024,
  },
  fileFilter,
});
