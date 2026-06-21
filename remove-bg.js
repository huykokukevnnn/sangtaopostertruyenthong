import { Jimp } from 'jimp';
import fs from 'fs';

const files = fs.readdirSync('./public/assets').filter(f => f.startsWith('char_') && f.endsWith('.png'));

async function processImages() {
  for (const file of files) {
    const img = await Jimp.read(`./public/assets/${file}`);
    
    // We want to make pure white or near-white transparent.
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      if (r > 240 && g > 240 && b > 240) {
        this.bitmap.data[idx + 3] = 0; // alpha
      }
    });

    await img.write(`./public/assets/${file}`);
    console.log(`Processed ${file}`);
  }
}

processImages();
