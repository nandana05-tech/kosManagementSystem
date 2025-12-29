const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Simple SVG icon template - a house/building icon representing "Kos"
const createSvgIcon = (size) => {
  const padding = size * 0.1;
  const iconSize = size - (padding * 2);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#3b82f6"/>
  
  <!-- House/Building Icon -->
  <g transform="translate(${padding}, ${padding})">
    <!-- Roof -->
    <path d="M${iconSize * 0.5} ${iconSize * 0.1} L${iconSize * 0.1} ${iconSize * 0.4} L${iconSize * 0.9} ${iconSize * 0.4} Z" 
          fill="white"/>
    
    <!-- Building Body -->
    <rect x="${iconSize * 0.15}" y="${iconSize * 0.35}" 
          width="${iconSize * 0.7}" height="${iconSize * 0.55}" 
          fill="white"/>
    
    <!-- Door -->
    <rect x="${iconSize * 0.4}" y="${iconSize * 0.6}" 
          width="${iconSize * 0.2}" height="${iconSize * 0.3}" 
          fill="#3b82f6"/>
    
    <!-- Windows Row 1 -->
    <rect x="${iconSize * 0.22}" y="${iconSize * 0.42}" 
          width="${iconSize * 0.12}" height="${iconSize * 0.1}" 
          fill="#3b82f6"/>
    <rect x="${iconSize * 0.66}" y="${iconSize * 0.42}" 
          width="${iconSize * 0.12}" height="${iconSize * 0.1}" 
          fill="#3b82f6"/>
          
    <!-- Windows Row 2 -->
    <rect x="${iconSize * 0.22}" y="${iconSize * 0.58}" 
          width="${iconSize * 0.12}" height="${iconSize * 0.1}" 
          fill="#3b82f6"/>
    <rect x="${iconSize * 0.66}" y="${iconSize * 0.58}" 
          width="${iconSize * 0.12}" height="${iconSize * 0.1}" 
          fill="#3b82f6"/>
  </g>
</svg>`;
};

// Output directory
const outputDir = path.join(__dirname, 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate icons
sizes.forEach(size => {
  const svg = createSvgIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`Generated: ${filename}`);
});

console.log('\n✅ All PWA icons generated successfully!');
console.log('\n⚠️  Note: These are SVG icons. For production, consider converting them to PNG.');
console.log('   You can use tools like:');
console.log('   - sharp (npm package)');
console.log('   - https://realfavicongenerator.net/');
console.log('   - Figma export');
