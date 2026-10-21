'use client';

import React from 'react';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

// Generate pseudo-random deterministic matrix from string hash for QR code visualization
function generateQrMatrix(text: string): boolean[][] {
  const size = 25; // 25x25 grid
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to draw finder pattern (7x7 with 3x3 center)
  const drawFinder = (startX: number, startY: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isBorder = x === 0 || x === 6 || y === 0 || y === 6;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[startY + y][startX + x] = isBorder || isCenter;
      }
    }
  };

  // 3 Finder patterns (Top-Left, Top-Right, Bottom-Left)
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash input text to fill deterministic data modules
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  // Populate data area avoiding finder patterns
  let currentSeed = Math.abs(hash) || 1234567;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inTopLeftFinder = x < 8 && y < 8;
      const inTopRightFinder = x >= size - 8 && y < 8;
      const inBottomLeftFinder = x < 8 && y >= size - 8;
      const inTiming = x === 6 || y === 6;

      if (!inTopLeftFinder && !inTopRightFinder && !inBottomLeftFinder && !inTiming) {
        currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
        matrix[y][x] = currentSeed % 2 === 0;
      }
    }
  }

  return matrix;
}

export function QrCodeSvg({ value, size = 110, className = '' }: QrCodeProps) {
  const matrix = React.useMemo(() => generateQrMatrix(value), [value]);
  const cellSize = size / matrix.length;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`bg-white p-1.5 border border-slate-200 ${className}`}
      aria-label="Código QR de verificación fiscal electrónica"
    >
      {matrix.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}
