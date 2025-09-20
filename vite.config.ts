
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Using injectManifest strategy to have full control over the service worker,
      // including custom push notification logic, while still getting precaching.
      injectManifest: {
        swSrc: 'sw.js', // Using the new service worker at the project root
        swDest: 'sw.js', // The output file will be dist/sw.js
      },
      manifest: {
        "name": "SakoonApp Admin",
        "short_name": "SakoonApp Admin",
        "description": "The admin and management app for Sakoon Listeners.",
        "theme_color": "#0891b2",
        "background_color": "#0F172A",
        "display": "standalone",
        "scope": "/",
        "start_url": "/",
        "orientation": "portrait-primary",
        "icons": [
          {
            "src": "https://listenerimages.netlify.app/images/icon3.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "https://listenerimages.netlify.app/images/icon2.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
          },
           {
            "src": "https://listenerimages.netlify.app/images/icon.png",
            "sizes": "1024x1024",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "https://listenerimages.netlify.app/images/icon2.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          }
        ]
      },
    })
  ],
});