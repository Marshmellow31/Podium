import { Box, type BoxProps } from '@mui/material';
import { c } from '@shared/design/tokens';

interface PodiumMarkProps {
  size?: number;
  radius?: number | string;
  sx?: BoxProps['sx'];
}

export function PodiumMark({ size = 36, radius = 12, sx }: PodiumMarkProps) {
  const barWidth = Math.max(4, Math.round(size * 0.14));
  const gap = Math.max(2, Math.round(size * 0.08));

  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flex: 'none',
        display: 'grid',
        placeItems: 'center',
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        background: c.inverse,
        boxShadow: 'inset 0 1px rgba(255,255,255,.08)',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: `${gap}px`, height: Math.round(size * 0.46) }}>
        {[0.5, 0.78, 0.62].map((height, index) => (
          <Box
            key={height}
            sx={{
              width: barWidth,
              height: `${height * 100}%`,
              borderRadius: `${Math.max(2, Math.round(barWidth / 2))}px ${Math.max(2, Math.round(barWidth / 2))}px 2px 2px`,
              background: index === 1 ? c.primary : c.primaryContainer,
              opacity: index === 1 ? 1 : 0.9,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
