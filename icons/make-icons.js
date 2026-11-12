// icon.svg faylından Android ikonlarını yaradır
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
(async () => {
  for (const [k, v] of Object.entries(sizes)) {
    const dir = path.join(__dirname, 'mipmap-' + k);
    fs.mkdirSync(dir, { recursive: true });
    await sharp(path.join(__dirname, 'icon.svg')).resize(v, v).png().toFile(path.join(dir, 'ic_launcher.png'));
  }
  console.log('Icons OK');
})();
