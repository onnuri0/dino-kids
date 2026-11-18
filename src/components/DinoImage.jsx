import React, { useState, useEffect, useRef } from 'react';

export default function DinoImage({ src, dino, silhouette = false, className = '' }) {
  const [hasError, setHasError] = useState(false);
  const [silhouetteReady, setSilhouetteReady] = useState(false);
  const canvasRef = useRef(null);

  const fallbackEmoji =
    dino.domain === '하늘' ? '🦅' : dino.domain === '바다' ? '🌊' : dino.diet === '육식' ? '🦖' : '🦕';

  useEffect(() => {
    setHasError(false);
    setSilhouetteReady(false);

    if (!silhouette || !src) return;

    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 캔버스 픽셀 추출을 위한 CORS 설정
    img.src = src;

    img.onload = () => {
      if (isCancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const maxDim = 400;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);

      try {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // 네 모서리 픽셀 평균으로 배경색 추정 (주로 흰색 JPG 배경)
        const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
        let bgR = 0, bgG = 0, bgB = 0, validCorners = 0;

        corners.forEach((idx) => {
          if (data[idx + 3] > 128) {
            bgR += data[idx];
            bgG += data[idx + 1];
            bgB += data[idx + 2];
            validCorners++;
          }
        });

        if (validCorners > 0) {
          bgR /= validCorners;
          bgG /= validCorners;
          bgB /= validCorners;
        } else {
          bgR = 255; bgG = 255; bgB = 255;
        }

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // 1) 원래 투명한 픽셀은 그대로 유지
          if (a < 40) {
            data[i + 3] = 0;
            continue;
          }

          // 2) 모서리 배경색과 유사하거나 매우 밝은 흰색 배경이면 투명 처리
          const diffFromBg = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          const isNearWhite = r > 235 && g > 235 && b > 235;

          if ((validCorners > 0 && diffFromBg < 55) || isNearWhite) {
            data[i + 3] = 0;
          } else {
            // 3) 공룡 본체 픽셀은 진한 실루엣 색상으로 통일
            data[i] = 28;
            data[i + 1] = 25;
            data[i + 2] = 23;
            data[i + 3] = 255;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        setSilhouetteReady(true);
      } catch {
        // 혹시 CORS 제한 이미지가 걸리면 폴백 이모지로 전환
        setHasError(true);
      }
    };

    img.onerror = () => {
      if (!isCancelled) setHasError(true);
    };

    return () => {
      isCancelled = true;
    };
  }, [src, silhouette]);

  if (!src || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center select-none ${className}`}>
        <span className={`text-7xl transition-all ${silhouette ? 'brightness-0' : ''}`}>
          {fallbackEmoji}
        </span>
      </div>
    );
  }

  if (silhouette) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <canvas
          ref={canvasRef}
          className={`max-h-full max-w-full object-contain drop-shadow-md transition-opacity duration-300 ${
            silhouetteReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={dino.name}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-contain transition-all duration-500 ${className}`}
    />
  );
}