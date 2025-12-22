const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

// Lazy load sharp to avoid startup crashes
let sharp = null;
const getSharp = () => {
  if (!sharp) {
    try {
      sharp = require('sharp');
    } catch (error) {
      logger.error('Failed to load sharp library:', error);
      return null;
    }
  }
  return sharp;
};
const DEFAULT_OPTIONS = {
  quality: parseInt(process.env.IMAGE_QUALITY) || 80,
  maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH) || 1920,
  maxHeight: parseInt(process.env.IMAGE_MAX_HEIGHT) || 1080,
  format: process.env.IMAGE_FORMAT || 'webp'
};

/**
 * Compress a single image file
 * @param {string} inputPath - Path to original image
 * @param {object} options - Compression options
 * @returns {Promise<{newPath: string, savedBytes: number, originalSize: number, newSize: number}>}
 */
const compressImage = async (inputPath, options = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Get sharp instance (lazy loaded)
  const sharpLib = getSharp();
  if (!sharpLib) {
    logger.warn('Sharp not available, skipping compression');
    // Return original file info if sharp is not available
    const stats = await fs.stat(inputPath);
    return {
      newPath: inputPath,
      newFilename: path.basename(inputPath),
      originalSize: stats.size,
      newSize: stats.size,
      savedBytes: 0,
      savedPercent: 0
    };
  }

  try {
    // Get original file stats
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;
    
    // Generate new filename with webp extension
    const dir = path.dirname(inputPath);
    const basename = path.basename(inputPath, path.extname(inputPath));
    const newFilename = `${basename}.${opts.format}`;
    const outputPath = path.join(dir, newFilename);
    
    // Process image with sharp
    let sharpInstance = sharpLib(inputPath);
    
    // Resize if larger than max dimensions (maintain aspect ratio)
    sharpInstance = sharpInstance.resize(opts.maxWidth, opts.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });
    
    // Convert to specified format with quality
    if (opts.format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: opts.quality });
    } else if (opts.format === 'jpeg' || opts.format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality: opts.quality });
    } else if (opts.format === 'png') {
      sharpInstance = sharpInstance.png({ quality: opts.quality });
    }
    
    // Save compressed image
    await sharpInstance.toFile(outputPath);
    
    // Get new file stats
    const newStats = await fs.stat(outputPath);
    const newSize = newStats.size;
    
    // Delete original file if different from output
    if (inputPath !== outputPath) {
      await fs.unlink(inputPath);
    }
    
    const savedBytes = originalSize - newSize;
    const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);
    
    logger.info(`Image compressed: ${path.basename(inputPath)} -> ${newFilename} (saved ${savedPercent}%)`);
    
    return {
      newPath: outputPath,
      newFilename,
      originalSize,
      newSize,
      savedBytes,
      savedPercent: parseFloat(savedPercent)
    };
  } catch (error) {
    logger.error(`Failed to compress image ${inputPath}:`, error);
    throw error;
  }
};

/**
 * Compress multiple images
 * @param {string[]} inputPaths - Array of paths to original images
 * @param {object} options - Compression options
 * @returns {Promise<Array>}
 */
const compressImages = async (inputPaths, options = {}) => {
  const results = await Promise.all(
    inputPaths.map(path => compressImage(path, options))
  );
  return results;
};

/**
 * Get image metadata
 * @param {string} imagePath - Path to image
 * @returns {Promise<object>}
 */
const getImageMetadata = async (imagePath) => {
  const sharpLib = getSharp();
  if (!sharpLib) {
    logger.warn('Sharp not available, cannot get metadata');
    return null;
  }
  try {
    const metadata = await sharpLib(imagePath).metadata();
    return metadata;
  } catch (error) {
    logger.error(`Failed to get metadata for ${imagePath}:`, error);
    throw error;
  }
};

module.exports = {
  compressImage,
  compressImages,
  getImageMetadata,
  DEFAULT_OPTIONS
};
