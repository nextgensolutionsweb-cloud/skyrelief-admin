import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  const imagePath = path.join(process.cwd(), 'public', 'favicon-v2.png');
  const imageData = fs.readFileSync(imagePath);
  const base64Image = `data:image/png;base64,${imageData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        <img src={base64Image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    ),
    { ...size }
  );
}
