import type { Variants } from 'motion/react';

export const spring = { type: 'spring', bounce: 0, duration: 0.38 } as const;
export const quickSpring = { type: 'spring', bounce: 0, duration: 0.24 } as const;
export const softSpring = { type: 'spring', bounce: 0.08, duration: 0.46 } as const;

export const pageMotion: Variants = {
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
};

export const surfaceMotion: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

export const popMotion: Variants = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
};

export const successPopMotion: Variants = {
  initial: { opacity: 0, scale: 0.72, rotate: -8 },
  animate: { opacity: 1, scale: 1, rotate: 0 },
};
