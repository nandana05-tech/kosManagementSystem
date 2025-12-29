const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if sharp is available, if not install it
try {
  require.resolve('sharp');
} catch (e) {
  console.log('Installing sharp...');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
}

const sharp = require('sharp');

// Icon sizes required for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Output directory
const outputDir = path.join(__dirname, 'public', 'icons');

// Source SVG (use the largest one as source)
const sourceSvg = path.join(outputDir, 'icon-512x512.svg');

// Generate PNG icons from SVG
async function generatePngIcons() {
  console.log('Converting SVG icons to PNG...\n');
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(sourceSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 All PNG icons generated successfully!');
}

generatePngIcons().catch(console.error);
