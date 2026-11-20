import multer from 'multer';
import path from 'path';

const allowedMimeTypes = [
  'text/csv',
  'application/vnd.ms-excel',
  'text/plain',
  'application/csv',
  'application/pdf',
  'application/x-pdf',
];

const allowedExtensions = ['.csv', '.pdf'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    const error = new Error('Invalid file extension. Only CSV and PDF statement files are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  if (!allowedMimeTypes.includes(file.mimetype) && file.mimetype !== 'application/octet-stream') {
    const error = new Error('Invalid file type. Only CSV and PDF statement files are allowed.');
    error.code = 'INVALID_MIME_TYPE';
    return cb(error, false);
  }

  cb(null, true);
};

const maxMb = parseInt(process.env.MAX_UPLOAD_MB || '10', 10);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxMb * 1024 * 1024,
  },
  fileFilter,
});
