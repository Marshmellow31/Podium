import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' https://apis.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https://*.googleapis.com https://fonts.gstatic.com https://*.firebaseio.com wss://*.firebaseio.com https://oauth2.googleapis.com",
  "frame-src https://*.firebaseapp.com https://accounts.google.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
  build: {
    // Vendor code changes far less often than app code. Splitting it means a
    // redeploy invalidates only the small app chunk and leaves the large
    // vendor chunks cached in every viewer's browser and on Vercel's CDN.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          // Auth and Firestore are split rather than bundled together: the
          // Firestore SDK is by far the largest dependency in the app and
          // changes on a different release cadence from Auth, so keeping them
          // apart means a Firebase bump usually invalidates only one of the
          // two in every returning visitor's cache. They also download in
          // parallel rather than as one serial 780 kB chunk.
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          query: ['@tanstack/react-query'],
        },
      },
    },
    // The vendor chunks are legitimately large; the warning is noise once they
    // are deliberately split and long-cached.
    chunkSizeWarningLimit: 700,
  },
  // Honour PORT when the environment assigns one, so several instances can run
  // side by side; 5173 stays the default for a plain `npm run dev`.
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Content-Security-Policy': contentSecurityPolicy,
    },
  },
});
