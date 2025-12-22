const upload = require('../config/multer');
const { badRequest } = require('../utils/response');
const { compressImage } = require('../utils/imageCompressor');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Handle multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return badRequest(res, 'Ukuran file terlalu besar. Maksimal 5MB');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return badRequest(res, 'Field file tidak sesuai');
    }
    return badRequest(res, err.message);
  }
  next();
};

/**
 * Compress uploaded image(s) after multer upload
 * This middleware should be used after multer upload middleware
 */
const compressAfterUpload = async (req, res, next) => {
  try {
    // Handle single file upload
    if (req.file) {
      const inputPath = req.file.path;
      const result = await compressImage(inputPath);
      
      // Update file info with compressed file details
      req.file.path = result.newPath;
      req.file.filename = result.newFilename;
      req.file.size = result.newSize;
      req.file.originalSize = result.originalSize;
      req.file.savedBytes = result.savedBytes;
      
      logger.info(`Compressed single file: ${result.newFilename} (saved ${result.savedPercent}%)`);
    }
    
    // Handle multiple files upload
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const inputPath = file.path;
        const result = await compressImage(inputPath);
        
        // Update file info with compressed file details
        req.files[i].path = result.newPath;
        req.files[i].filename = result.newFilename;
        req.files[i].size = result.newSize;
        req.files[i].originalSize = result.originalSize;
        req.files[i].savedBytes = result.savedBytes;
        
        logger.info(`Compressed file ${i + 1}/${req.files.length}: ${result.newFilename} (saved ${result.savedPercent}%)`);
      }
    }
    
    next();
  } catch (error) {
    logger.error('Image compression failed:', error);
    // Continue without compression if it fails
    next();
  }
};

/**
 * Upload single profile photo with compression
 */
const uploadProfilePhoto = [
  upload.single('fotoProfil'),
  handleUploadError,
  compressAfterUpload
];

/**
 * Upload single room photo with compression
 */
const uploadRoomPhoto = [
  upload.single('fotoKamar'),
  handleUploadError,
  compressAfterUpload
];

/**
 * Upload multiple room photos (max 10) with compression
 */
const uploadRoomPhotos = [
  upload.array('fotoKamar', 10),
  handleUploadError,
  compressAfterUpload
];

/**
 * Upload report photo with compression
 */
const uploadReportPhoto = [
  upload.single('fotoLaporan'),
  handleUploadError,
  compressAfterUpload
];

/**
 * Upload payment proof with compression
 */
const uploadPaymentProof = [
  upload.single('buktiPembayaran'),
  handleUploadError,
  compressAfterUpload
];

module.exports = {
  uploadProfilePhoto,
  uploadRoomPhoto,
  uploadRoomPhotos,
  uploadReportPhoto,
  uploadPaymentProof,
  handleUploadError,
  compressAfterUpload
};
