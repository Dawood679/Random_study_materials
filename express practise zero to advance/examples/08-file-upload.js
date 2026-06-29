// ============================================================
//  08 - File Uploads with Multer
//  Topics: single file, multiple files, file type filter,
//          size limits, memory vs disk storage
// ============================================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
app.use(express.json());

// Create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── 1. Disk Storage (saves file to disk) ──────────────────────
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // folder to save files
  },
  filename: (req, file, cb) => {
    // <fieldname>-<timestamp>.<ext>  e.g. avatar-1719000000000.jpg
    const ext = path.extname(file.originalname);
    const name = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

// ── 2. Memory Storage (keeps file in buffer — good for processing) ──
const memoryStorage = multer.memoryStorage();

// ── 3. File Filter (allow only images) ───────────────────────
const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true); // accept
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPEG/PNG/WEBP/GIF images allowed'));
  }
};

// ── Multer instances ──────────────────────────────────────────
const uploadDisk = multer({
  storage: diskStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

// ── Routes ────────────────────────────────────────────────────

// Single file upload
app.post('/upload/avatar', uploadDisk.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  res.json({
    message: 'Avatar uploaded',
    file: {
      originalName: req.file.originalname,
      savedAs: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
    },
    body: req.body, // other form fields are here
  });
});

// Multiple files (max 5) — same field name
app.post('/upload/photos', uploadDisk.array('photos', 5), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ error: 'No files uploaded' });

  res.json({
    message: `${req.files.length} photo(s) uploaded`,
    files: req.files.map((f) => ({ name: f.filename, size: f.size })),
  });
});

// Mixed fields (avatar + documents)
app.post(
  '/upload/mixed',
  uploadDisk.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 3 },
  ]),
  (req, res) => {
    res.json({
      avatar: req.files['avatar']?.[0]?.filename,
      documents: req.files['documents']?.map((f) => f.filename),
    });
  }
);

// Memory storage — process image buffer
app.post('/upload/process', uploadMemory.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // req.file.buffer contains the file as a Buffer
  // You can pass it to sharp, jimp, etc. for processing
  res.json({
    message: 'File received in memory (not saved)',
    size: req.file.buffer.length,
    mimetype: req.file.mimetype,
  });
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// ── Multer Error Handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'File is too large',
      LIMIT_FILE_COUNT: 'Too many files',
      LIMIT_UNEXPECTED_FILE: err.message,
    };
    return res.status(400).json({ error: messages[err.code] || err.message });
  }
  next(err);
});

const PORT = 3008;
app.listen(PORT, () => {
  console.log(`\n[08-file-upload] Server running at http://localhost:${PORT}`);
  console.log('Endpoints (use Postman or curl with multipart/form-data):');
  console.log('  POST /upload/avatar    field: avatar  (single image, max 5MB)');
  console.log('  POST /upload/photos    field: photos  (up to 5 images)');
  console.log('  POST /upload/mixed     fields: avatar + documents');
  console.log('  POST /upload/process   field: image   (memory, not saved)');
  console.log(`\nUploads saved to: ${uploadsDir}`);
});
