const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only by extension and MIME type
  const extOk = file.originalname.match(/\.(jpg|jpeg|png)$/i);
  const mimeOk = file.mimetype.match(/^image\/(jpeg|png|jpg)$/i);
  if (!extOk || !mimeOk) {
    return cb(new Error('Only JPG/PNG image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 } // 5MB limit, max 5 files
});

const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

module.exports = { upload, uploadMultiple };
