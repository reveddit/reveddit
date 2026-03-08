import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const IS_PRODUCTION = mode === 'production'
  const IS_STAGING = env.TARGET_ENV === 'staging'

  const API_REVEDDIT = 'https://api.reveddit.com/'
  const MODLOGS_API = API_REVEDDIT + 'short/modlogs/api/'
  let OAUTH_REDDIT_REV = 'https://cred2.reveddit.com/'
  const OAUTH_REDDIT_REV_STAGING = 'https://cred2-staging.reveddit.com/'
  const EXTENSION_ID_DEV = 'flebbibjihapbjipljlfkokfejgaipil'
  const EXTENSION_ID_PROD = 'ickfhlplfbipnfahjbeongebnmojbnhm'
  let EXTENSION_ID = EXTENSION_ID_PROD

  let flask_host = API_REVEDDIT
  let short = 'short/'
  let long = 'long/'
  if (!IS_PRODUCTION) {
    flask_host = 'http://localhost:5000/'
    short = ''
    long = ''
    OAUTH_REDDIT_REV = 'http://localhost:8787/'
    if (IS_STAGING) {
      OAUTH_REDDIT_REV = OAUTH_REDDIT_REV_STAGING
    }
    EXTENSION_ID = EXTENSION_ID_DEV
  }

  const src = (p) => path.resolve(__dirname, 'src', p)
  const srcDir = path.resolve(__dirname, 'src')

  return {
    // Vite's root is src/ — that's where index.html lives
    root: srcDir,

    plugins: [
      react({ include: /\.(js|jsx|ts|tsx)$/ }),
      IS_PRODUCTION &&
        VitePWA({
          strategies: 'injectManifest',
          srcDir: srcDir,
          filename: 'service-worker.js',
          outDir: path.resolve(__dirname, 'dist'),
          injectRegister: null,
          manifest: false,
        }),
    ].filter(Boolean),

    resolve: {
      alias: {
        api: src('api'),
        components: src('components'),
        contexts: src('contexts'),
        data: src('data'),
        data_processing: src('data_processing'),
        hooks: src('hooks'),
        pages: src('pages'),
        snuownd: src('snuownd.js'),
        state: src('state.js'),
        svg: src('svg'),
        utils: src('utils.js'),
      },
    },

    define: {
      REDDIT_API_CLIENT_ID: JSON.stringify(env.REDDIT_API_CLIENT_ID),
      LAMBDA_ENDPOINT: JSON.stringify(env.LAMBDA_ENDPOINT),
      STRIPE_PUBLISHABLE_KEY: JSON.stringify(env.STRIPE_PUBLISHABLE_KEY),
      REVEDDIT_FLASK_HOST_SHORT: JSON.stringify(flask_host + short),
      REVEDDIT_FLASK_HOST_LONG: JSON.stringify(flask_host + long),
      U_MODLOGS_API: JSON.stringify(MODLOGS_API),
      OAUTH_REDDIT_REV: JSON.stringify(OAUTH_REDDIT_REV),
      EXTENSION_ID: JSON.stringify(EXTENSION_ID),
    },

    // The project uses .js extension for JSX files (conventional for this codebase).
    // Vite's vite:esbuild plugin excludes .js files by default; override to include them
    // with the jsx loader so JSX syntax is handled correctly in production builds.
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.js$/,
      exclude: /node_modules/,
    },
    optimizeDeps: {
      include: ['snuownd'],
      esbuildOptions: {
        loader: { '.js': 'jsx' },
      },
    },

    css: {
      preprocessorOptions: {
        sass: {
          loadPaths: [path.resolve(__dirname, 'node_modules')],
        },
      },
    },

    // Serve static assets from dist/ during dev (images, _redirects, etc.)
    publicDir: path.resolve(__dirname, 'dist'),

    build: {
      // Include snuownd.js (a CJS/UMD file in src/) in the CommonJS transform
      // so Rollup can import it as an ES module.
      commonjsOptions: {
        include: [/node_modules/, /snuownd\.js/],
      },
      outDir: path.resolve(__dirname, 'dist'),
      assetsDir: 'x-files',
      sourcemap: true,
      // Don't wipe dist/ on rebuild — static assets (images, _redirects, etc.)
      // live there and are committed to git. The clean script handles removing
      // stale generated files before each build.
      emptyOutDir: false,
    },

    server: {
      host: '0.0.0.0',
      port: 8080,
      strictPort: true,
    },
  }
})
