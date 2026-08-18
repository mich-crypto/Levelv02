import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';

function generateIcon(size: number, filename: string) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = size * 0.38;
  const innerRadius = size * 0.18;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 10, g = 10, b = 10, a = 255; // #0a0a0a

      // Outer ring
      if (Math.abs(dist - radius) < size * 0.035) {
        r = 82; g = 82; b = 91; // neutral-600
      }
      // Center green bubble
      else if (dist <= innerRadius) {
        r = 16; g = 185; b = 129; // #10b981 (emerald-500)
      }
      // Crosshairs
      else if ((Math.abs(dx) < size * 0.015 && Math.abs(dy) < radius) ||
               (Math.abs(dy) < size * 0.015 && Math.abs(dx) < radius)) {
        r = 82; g = 82; b = 91;
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join(process.cwd(), 'public', filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

generateIcon(192, 'icon-192.png');
generateIcon(512, 'icon-512.png');
