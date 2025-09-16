import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: true, // Necessário para o Sentry
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
 
    tsconfigPaths(),
    // Plugin do Sentry para upload de source maps
     sentryVitePlugin({
       org: process.env.SENTRY_ORG,
       project: process.env.SENTRY_PROJECT,
       authToken: process.env.SENTRY_AUTH_TOKEN,
       sourcemaps: {
         assets: './dist/**',
         ignore: ['node_modules'],
         filesToDeleteAfterUpload: './dist/**/*.map'
       },
       release: {
         name: process.env.SENTRY_RELEASE || `umadepar-${Date.now()}`
       }
     })
  ],
})
