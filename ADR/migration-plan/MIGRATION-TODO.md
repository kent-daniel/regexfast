# Migration TODO List: Next.js → Vite + tRPC

**Status**: 🔴 Not Started  
**Estimated Total Time**: 4-6 weeks (solo) | 2-3 weeks (team of 2)  
**Last Updated**: January 2, 2026

---

## Pre-Migration Checklist

- [ ] **Decision approved** by team/stakeholders
- [ ] **Backup current codebase** (git tag: `pre-vite-migration`)
- [ ] **Document current API endpoints** (list all server actions)
- [ ] **Set up monitoring** for current app (baseline metrics)
- [ ] **Create feature freeze branch** (no new features during migration)
- [ ] **Prepare rollback plan** (keep old deployment available)
- [ ] **Schedule downtime window** (if needed) or plan zero-downtime deploy
- [ ] **Notify users** of upcoming maintenance/changes (if significant)

---

## Phase 1: Project Setup & Configuration (Week 1)

**Goal**: Get Vite project running with basic React app

### 1.1 Initialize Vite Project (2-3 hours)

- [ ] Create new branch: `git checkout -b feat/vite-migration`
- [ ] Initialize Vite in new directory or subfolder:
  ```bash
  npm create vite@latest regexfast-vite -- --template react-ts
  ```
- [ ] Or initialize in root (if replacing Next.js):
  ```bash
  # Move Next.js files to temporary location first
  mkdir ../regexfast-nextjs-backup
  cp -r . ../regexfast-nextjs-backup/
  ```
- [ ] Install Vite core dependencies:
  ```bash
  npm install vite @vitejs/plugin-react
  ```

### 1.2 Configure Vite (2 hours)

- [ ] Create `vite.config.ts`:
  ```typescript
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import tsconfigPaths from 'vite-tsconfig-paths'
  
  export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  })
  ```
- [ ] Install path resolver: `npm install -D vite-tsconfig-paths`
- [ ] Update `tsconfig.json` (ensure paths are correct):
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```
- [ ] Create/update `.env` files:
  - [ ] Rename `NEXT_PUBLIC_*` → `VITE_*` variables
  - [ ] Create `.env.local`, `.env.development`, `.env.production`
- [ ] Update `.gitignore`:
  ```
  # Vite
  dist
  dist-ssr
  *.local
  
  # Remove Next.js entries
  # .next/
  # out/
  ```

### 1.3 Setup Tailwind CSS (1 hour)

- [ ] Install Tailwind (may already be installed):
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  ```
- [ ] Verify `tailwind.config.ts` works with Vite
- [ ] Verify `postcss.config.mjs` works with Vite
- [ ] Update `tailwind.config.ts` content paths if needed:
  ```typescript
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  ```
- [ ] Create `src/index.css` (or rename from `globals.css`):
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

### 1.4 Create Entry Point Files (1 hour)

- [ ] Create `index.html` in root:
  ```html
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Magic Regex Generator</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.tsx"></script>
    </body>
  </html>
  ```
- [ ] Create `src/main.tsx`:
  ```typescript
  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import App from './App.tsx'
  import './index.css'
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  ```
- [ ] Create `src/App.tsx`:
  ```typescript
  import { RouterProvider } from 'react-router-dom'
  import { router } from './router'
  import { TRPCProvider } from './lib/trpc'
  
  function App() {
    return (
      <TRPCProvider>
        <RouterProvider router={router} />
      </TRPCProvider>
    )
  }
  
  export default App
  ```

### 1.5 Install React Router (1-2 hours)

- [ ] Choose router (pick one):
  - [ ] **Option A**: React Router 7 (recommended, more familiar)
    ```bash
    npm install react-router-dom
    ```
  - [ ] **Option B**: TanStack Router (more type-safe)
    ```bash
    npm install @tanstack/react-router
    ```
- [ ] Create `src/router.tsx` (React Router example):
  ```typescript
  import { createBrowserRouter } from 'react-router-dom'
  import { RootLayout } from './layouts/RootLayout'
  import HomePage from './pages/HomePage'
  import SnippetsPage from './pages/SnippetsPage'
  import SnippetDetailPage from './pages/SnippetDetailPage'
  
  export const router = createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'quick-regex-snippets', element: <SnippetsPage /> },
        { path: 'quick-regex-snippets/:id', element: <SnippetDetailPage /> },
      ],
    },
  ])
  ```
- [ ] Create `src/layouts/RootLayout.tsx`:
  ```typescript
  import { Outlet } from 'react-router-dom'
  import { Header } from '@/components/Header'
  import Footer from '@/components/Footer'
  import Background from '@/components/Background'
  import { Container } from '@/components/Container'
  
  export function RootLayout() {
    return (
      <>
        <Background />
        <Container>
          <Header />
          <Outlet />
          <Footer />
        </Container>
      </>
    )
  }
  ```

### 1.6 Test Basic Vite App (30 min)

- [ ] Run dev server: `npm run dev`
- [ ] Verify app loads at `http://localhost:3000`
- [ ] Check for console errors
- [ ] Verify HMR works (edit a file, see instant update)
- [ ] Test that paths (`@/*`) resolve correctly

---

## Phase 2: Backend Setup - tRPC Server (Week 1-2)

**Goal**: Create standalone backend server with tRPC

### 2.1 Setup Backend Project Structure (1 hour)

- [ ] Create backend directory:
  ```bash
  mkdir -p server
  mkdir -p server/routers
  mkdir -p server/lib
  ```
- [ ] Create `server/package.json` (or add scripts to root):
  ```json
  {
    "name": "regexfast-api",
    "scripts": {
      "dev": "tsx watch server/index.ts",
      "build": "tsc",
      "start": "node dist/server/index.js"
    }
  }
  ```

### 2.2 Install Backend Dependencies (30 min)

- [ ] Install tRPC server:
  ```bash
  npm install @trpc/server @trpc/client @trpc/react-query
  ```
- [ ] Install server framework (choose one):
  - [ ] **Option A**: Express (more familiar)
    ```bash
    npm install express cors
    npm install -D @types/express @types/cors
    ```
  - [ ] **Option B**: Fastify (faster)
    ```bash
    npm install fastify @fastify/cors
    ```
- [ ] Install React Query:
  ```bash
  npm install @tanstack/react-query
  ```
- [ ] Install dev tools:
  ```bash
  npm install -D tsx nodemon
  ```
- [ ] Ensure Zod is installed (already in package.json)
- [ ] Ensure Replicate is installed (already in package.json)

### 2.3 Create tRPC Server Setup (2 hours)

- [ ] Create `server/trpc.ts`:
  ```typescript
  import { initTRPC } from '@trpc/server';
  import { ZodError } from 'zod';
  
  const t = initTRPC.create({
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });
  
  export const router = t.router;
  export const publicProcedure = t.procedure;
  ```

- [ ] Create `server/index.ts` (Express example):
  ```typescript
  import express from 'express';
  import cors from 'cors';
  import { createExpressMiddleware } from '@trpc/server/adapters/express';
  import { appRouter } from './routers';
  
  const app = express();
  const PORT = process.env.PORT || 4000;
  
  app.use(cors());
  app.use(express.json());
  
  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: () => ({}),
    })
  );
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
  
  export type AppRouter = typeof appRouter;
  ```

### 2.4 Migrate Server Actions to tRPC Routers (3-4 hours)

- [ ] Create `server/routers/regex.router.ts`:
  ```typescript
  import { router, publicProcedure } from '../trpc';
  import { z } from 'zod';
  import { getRegexUseCase, generateRegexWithAIUseCase } from '../use-cases/use-cases';
  
  const getMatchesInput = z.object({
    pattern: z.string(),
    text: z.string(),
    flag: z.string(),
    language: z.string().optional(),
  });
  
  const generateRegexInput = z.object({
    description: z.string().min(1),
    shouldMatch: z.array(z.string()),
    shouldNotMatch: z.array(z.string()).optional(),
    info: z.string().optional(),
  });
  
  export const regexRouter = router({
    getMatches: publicProcedure
      .input(getMatchesInput)
      .query(async ({ input }) => {
        const { pattern, text, flag, language } = input;
        
        if (text.length === 0 || pattern.length === 0) {
          return { status: 'invalid', timeSpent: '0', matches: [] };
        }
        
        const { status, timeSpent, matches } = await getRegexUseCase(
          pattern,
          text,
          flag
        );
        
        return { status, timeSpent: timeSpent.toFixed(2), matches };
      }),
    
    generate: publicProcedure
      .input(generateRegexInput)
      .mutation(async ({ input }) => {
        return await generateRegexWithAIUseCase(input);
      }),
  });
  ```

- [ ] Create `server/routers/index.ts`:
  ```typescript
  import { router } from '../trpc';
  import { regexRouter } from './regex.router';
  
  export const appRouter = router({
    regex: regexRouter,
  });
  
  export type AppRouter = typeof appRouter;
  ```

### 2.5 Move Use Cases to Backend (2 hours)

- [ ] Copy `src/use-cases/` → `server/use-cases/`
- [ ] Copy `src/models.ts` → `server/models.ts`
- [ ] Remove `"use server"` directives from use-cases
- [ ] Update imports to use server paths
- [ ] Ensure Replicate API key is in backend `.env`:
  ```
  REPLICATE_API_TOKEN=your_token_here
  ```

### 2.6 Test Backend Server (1 hour)

- [ ] Run backend: `npm run dev` (in server directory)
- [ ] Test in browser: `http://localhost:4000/trpc`
- [ ] Test with curl or Postman:
  ```bash
  curl -X POST http://localhost:4000/trpc/regex.getMatches \
    -H "Content-Type: application/json" \
    -d '{"pattern":"\\d+","text":"test123","flag":"g"}'
  ```
- [ ] Verify Replicate integration still works
- [ ] Check for any import errors

---

## Phase 3: Frontend - tRPC Client Integration (Week 2)

**Goal**: Connect React frontend to tRPC backend

### 3.1 Setup tRPC Client (1-2 hours)

- [ ] Create `src/lib/trpc.ts`:
  ```typescript
  import { createTRPCReact } from '@trpc/react-query';
  import { httpBatchLink } from '@trpc/client';
  import type { AppRouter } from '../../server/routers';
  
  export const trpc = createTRPCReact<AppRouter>();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/trpc';
  
  export function TRPCProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => new QueryClient());
    const [trpcClient] = React.useState(() =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: API_URL,
          }),
        ],
      })
    );
  
    return (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    );
  }
  ```

- [ ] Add `VITE_API_URL` to `.env`:
  ```
  VITE_API_URL=http://localhost:4000/trpc
  ```

### 3.2 Setup React Query DevTools (30 min)

- [ ] Install devtools:
  ```bash
  npm install @tanstack/react-query-devtools
  ```
- [ ] Add to `TRPCProvider`:
  ```typescript
  import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
  
  // Inside provider:
  <ReactQueryDevtools initialIsOpen={false} />
  ```

### 3.3 Migrate Components to Use tRPC (4-6 hours)

- [ ] **RegexEditor.tsx** - Update to use tRPC:
  ```typescript
  import { trpc } from '@/lib/trpc';
  
  // Replace server action with:
  const { data, isLoading } = trpc.regex.getMatches.useQuery({
    pattern,
    text,
    flag,
  });
  ```

- [ ] **RegexGeneratorForm.tsx** - Update to use mutation:
  ```typescript
  const mutation = trpc.regex.generate.useMutation({
    onSuccess: (data) => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    },
  });
  
  const handleSubmit = async (formData) => {
    await mutation.mutateAsync(formData);
  };
  ```

- [ ] Remove all imports from `@/actions/actions`
- [ ] Update loading states to use `isLoading` from React Query
- [ ] Update error handling to use `error` from React Query
- [ ] Test each component individually

### 3.4 Migrate Page Components (2-3 hours)

- [ ] Create `src/pages/HomePage.tsx`:
  ```typescript
  import CommonRegexSection from "@/components/CommonRegexSection";
  import FAQSection from "@/components/FAQSection";
  import Hero from "@/components/Hero";
  import { RegexPlaygroundSection } from "@/components/RegexPlaygroundSection";
  
  export default function HomePage() {
    return (
      <main className="min-h-screen p-2">
        <Hero />
        <RegexPlaygroundSection />
        <CommonRegexSection />
        <FAQSection />
      </main>
    );
  }
  ```

- [ ] Create `src/pages/SnippetsPage.tsx`:
  ```typescript
  import RegexEditor from "@/components/RegexEditor";
  import { RegexResultProvider } from "@/components/RegexResultContext";
  import { content } from "@/content";
  import { Link } from "react-router-dom";
  
  export default function SnippetsPage() {
    return (
      <main className="text-left overflow-y-scroll">
        <RegexResultProvider>
          {content.map((item, index) => (
            <div key={index} className="my-6 pb-5 border-b border-gray-600">
              <Link to={`/quick-regex-snippets/${item.id}`}>
                <h2 className="text-xl font-semibold mb-2 text-gray-300 text-center">
                  {item.title}
                </h2>
              </Link>
              <p className="text-gray-400 text-center">{item.description}</p>
              <RegexEditor
                regexPatternProp={item.value}
                inputTextProp={item.inputTextProp}
              />
            </div>
          ))}
        </RegexResultProvider>
      </main>
    );
  }
  ```

- [ ] Create `src/pages/SnippetDetailPage.tsx`:
  ```typescript
  import { useParams, Navigate } from "react-router-dom";
  import { content } from "@/content";
  import { RegexResultProvider } from "@/components/RegexResultContext";
  import RegexEditor from "@/components/RegexEditor";
  
  export default function SnippetDetailPage() {
    const { id } = useParams<{ id: string }>();
    const item = content.find((item) => item.id === id);
  
    if (!item) {
      return <Navigate to="/404" replace />;
    }
  
    return (
      <main className="text-center">
        <RegexResultProvider>
          <h2 className="text-2xl font-semibold my-4 text-gray-300 text-center">
            {item.title}
          </h2>
          <p className="text-gray-400 text-center mb-4">{item.description}</p>
          <RegexEditor
            regexPatternProp={item.value}
            inputTextProp={item.inputTextProp}
            flagsProp={item.flags.split("")}
          />
        </RegexResultProvider>
      </main>
    );
  }
  ```

- [ ] Create `src/pages/NotFoundPage.tsx`:
  ```typescript
  import { Link } from "react-router-dom";
  
  export default function NotFoundPage() {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <Link to="/" className="text-blue-500 hover:underline">
          Go back home
        </Link>
      </div>
    );
  }
  ```

- [ ] Update router to include 404 route:
  ```typescript
  { path: '*', element: <NotFoundPage /> }
  ```

---

## Phase 4: SEO & Metadata (Week 2-3)

**Goal**: Restore SEO capabilities with prerendering or react-helmet

### 4.1 Install SEO Tools (30 min)

- [ ] Install react-helmet-async:
  ```bash
  npm install react-helmet-async
  ```
- [ ] Wrap app with HelmetProvider in `src/main.tsx`:
  ```typescript
  import { HelmetProvider } from 'react-helmet-async';
  
  <HelmetProvider>
    <App />
  </HelmetProvider>
  ```

### 4.2 Create SEO Component (1 hour)

- [ ] Create `src/components/SEO.tsx`:
  ```typescript
  import { Helmet } from 'react-helmet-async';
  
  interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
  }
  
  export function SEO({ title, description, image, url }: SEOProps) {
    const defaultTitle = 'Magic Regex Generator';
    const defaultDescription = 'Generate and test regular expressions effortlessly...';
    const finalTitle = title ? `${title} - ${defaultTitle}` : defaultTitle;
    
    return (
      <Helmet>
        <title>{finalTitle}</title>
        <meta name="description" content={description || defaultDescription} />
        
        {/* Open Graph */}
        <meta property="og:title" content={finalTitle} />
        <meta property="og:description" content={description || defaultDescription} />
        {image && <meta property="og:image" content={image} />}
        {url && <meta property="og:url" content={url} />}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={finalTitle} />
        <meta name="twitter:description" content={description || defaultDescription} />
        {image && <meta name="twitter:image" content={image} />}
      </Helmet>
    );
  }
  ```

### 4.3 Add SEO to All Pages (1 hour)

- [ ] Add `<SEO />` to HomePage
- [ ] Add `<SEO />` to SnippetsPage
- [ ] Add `<SEO />` to SnippetDetailPage with dynamic data
- [ ] Test that meta tags appear in browser DevTools

### 4.4 Setup Prerendering (Optional but Recommended) (4-6 hours)

Choose one approach:

**Option A: vite-plugin-prerender-routes**
- [ ] Install plugin:
  ```bash
  npm install -D vite-plugin-prerender-routes
  ```
- [ ] Configure in `vite.config.ts`:
  ```typescript
  import prerenderRoutes from 'vite-plugin-prerender-routes';
  
  export default defineConfig({
    plugins: [
      react(),
      tsconfigPaths(),
      prerenderRoutes({
        routes: [
          '/',
          '/quick-regex-snippets',
          ...content.map(item => `/quick-regex-snippets/${item.id}`)
        ],
      }),
    ],
  });
  ```

**Option B: Vike (formerly vite-plugin-ssr)**
- [ ] Install Vike:
  ```bash
  npm install vike
  ```
- [ ] Follow Vike setup guide: https://vike.dev/
- [ ] Configure SSR for specific routes
- [ ] Test SSR in production build

**Option C: Accept CSR only**
- [ ] Skip prerendering
- [ ] Rely on react-helmet for meta tags
- [ ] Monitor SEO performance in Google Search Console

---

## Phase 5: Styling & Assets (Week 3)

**Goal**: Migrate fonts, images, and styling

### 5.1 Font Setup (1-2 hours)

- [ ] Download Inter font files (if self-hosting):
  ```bash
  # Or use Google Fonts CDN
  ```
- [ ] Create `src/fonts` directory
- [ ] Add font files to `public/fonts/`
- [ ] Create `src/index.css` with @font-face:
  ```css
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/Inter-Variable.woff2') format('woff2');
    font-weight: 100 900;
    font-display: swap;
  }
  
  body {
    font-family: 'Inter', sans-serif;
  }
  ```
- [ ] Or use Google Fonts in `index.html`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
  ```

### 5.2 Move Static Assets (30 min)

- [ ] Copy `public/` folder contents to Vite `public/`
- [ ] Update any hardcoded paths from `/` to use `import.meta.env.BASE_URL` if needed
- [ ] Verify favicons work
- [ ] Test images load correctly

### 5.3 Update CSS Imports (30 min)

- [ ] Ensure `src/index.css` imports in `main.tsx`
- [ ] Remove Next.js-specific CSS (if any)
- [ ] Test Tailwind classes work
- [ ] Verify component styling is unchanged

---

## Phase 6: Environment & Configuration (Week 3)

**Goal**: Setup environment variables and build configuration

### 6.1 Environment Variables (1 hour)

- [ ] Create `.env.development`:
  ```
  VITE_API_URL=http://localhost:4000/trpc
  VITE_POSTHOG_KEY=your_key
  ```
- [ ] Create `.env.production`:
  ```
  VITE_API_URL=https://api.yourapp.com/trpc
  VITE_POSTHOG_KEY=your_key
  ```
- [ ] Create backend `.env`:
  ```
  PORT=4000
  REPLICATE_API_TOKEN=your_token
  NODE_ENV=development
  ```
- [ ] Update all `process.env.NEXT_PUBLIC_*` to `import.meta.env.VITE_*`:
  ```typescript
  // Before
  const key = process.env.NEXT_PUBLIC_KEY;
  
  // After
  const key = import.meta.env.VITE_KEY;
  ```
- [ ] Create type definitions for env vars in `src/vite-env.d.ts`:
  ```typescript
  /// <reference types="vite/client" />
  
  interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_POSTHOG_KEY: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  ```

### 6.2 Update Package.json Scripts (30 min)

- [ ] Update scripts in `package.json`:
  ```json
  {
    "scripts": {
      "dev": "vite",
      "dev:server": "tsx watch server/index.ts",
      "dev:all": "concurrently \"npm:dev\" \"npm:dev:server\"",
      "build": "tsc && vite build",
      "build:server": "tsc --project tsconfig.server.json",
      "build:all": "npm run build && npm run build:server",
      "preview": "vite preview",
      "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
    }
  }
  ```
- [ ] Install concurrently for running multiple commands:
  ```bash
  npm install -D concurrently
  ```
- [ ] Create `tsconfig.server.json` for backend:
  ```json
  {
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "outDir": "./dist",
      "rootDir": "./server",
      "module": "commonjs"
    },
    "include": ["server/**/*"]
  }
  ```

### 6.3 PostHog Integration (1 hour)

- [ ] Update PostHog initialization to work with Vite:
  ```typescript
  // src/lib/posthog.ts
  import posthog from 'posthog-js';
  
  export function initPostHog() {
    if (typeof window !== 'undefined') {
      posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
        api_host: 'https://app.posthog.com',
      });
    }
  }
  ```
- [ ] Call `initPostHog()` in `main.tsx`
- [ ] Test that events are tracked

---

## Phase 7: Testing & QA (Week 3-4)

**Goal**: Thoroughly test all functionality

### 7.1 Manual Testing Checklist (2-3 hours)

- [ ] **Homepage**
  - [ ] All sections render correctly
  - [ ] Hero section loads
  - [ ] Regex playground works
  - [ ] Common regex section displays
  - [ ] FAQ section displays

- [ ] **Quick Snippets Page** (`/quick-regex-snippets`)
  - [ ] All snippets render
  - [ ] Regex editors work
  - [ ] Navigation works

- [ ] **Individual Snippet Page** (`/quick-regex-snippets/[id]`)
  - [ ] Dynamic route works for all IDs
  - [ ] Regex editor works
  - [ ] 404 page shows for invalid IDs

- [ ] **Regex Generator**
  - [ ] Form submission works
  - [ ] Loading states show
  - [ ] Errors display correctly
  - [ ] Success case works
  - [ ] Generated regex displays

- [ ] **Regex Testing**
  - [ ] Pattern input works
  - [ ] Text input works
  - [ ] Flag toggles work
  - [ ] Matches highlight correctly
  - [ ] Performance timing shows

### 7.2 Cross-Browser Testing (1-2 hours)

- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Test on mobile browsers (iOS Safari, Chrome Android)

### 7.3 Performance Testing (1 hour)

- [ ] Run Lighthouse audit
- [ ] Check bundle size: `npm run build` and analyze `dist/`
- [ ] Install bundle analyzer:
  ```bash
  npm install -D rollup-plugin-visualizer
  ```
- [ ] Add to `vite.config.ts`:
  ```typescript
  import { visualizer } from 'rollup-plugin-visualizer';
  
  plugins: [
    // ...
    visualizer({ open: true }),
  ]
  ```
- [ ] Optimize large bundles if needed
- [ ] Test API response times

### 7.4 SEO Testing (1-2 hours)

- [ ] Verify meta tags in `<head>` using browser DevTools
- [ ] Test Open Graph tags with https://www.opengraph.xyz/
- [ ] Test Twitter cards with https://cards-dev.twitter.com/validator
- [ ] Test with Google's Rich Results Test
- [ ] If using prerendering, verify HTML source contains content:
  ```bash
  curl http://localhost:4173/ | grep -i "regex"
  ```

### 7.5 Error Handling Testing (1 hour)

- [ ] Test with invalid regex patterns
- [ ] Test with network errors (disable backend)
- [ ] Test with Replicate API errors
- [ ] Test form validation
- [ ] Test 404 pages
- [ ] Test error boundaries (add if missing)

---

## Phase 8: Deployment Setup (Week 4)

**Goal**: Deploy to production

### 8.1 Choose Deployment Strategy (1 hour)

**Option A: Separate Deployments** (Recommended for flexibility)
- Frontend: Vercel/Netlify/Cloudflare Pages
- Backend: Railway/Render/Fly.io

**Option B: Monorepo on Vercel/Netlify**
- Use Vercel/Netlify Functions for backend
- Single deployment

**Option C: Docker + VPS**
- Full control, more setup
- Deploy to DigitalOcean/Linode/AWS

### 8.2 Frontend Deployment (2-3 hours)

**If using Vercel:**
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Login: `vercel login`
- [ ] Deploy: `vercel --prod`
- [ ] Configure build settings:
  - Build Command: `npm run build`
  - Output Directory: `dist`
- [ ] Set environment variables in Vercel dashboard:
  - `VITE_API_URL=https://your-backend.com/trpc`

**If using Netlify:**
- [ ] Install Netlify CLI: `npm i -g netlify-cli`
- [ ] Login: `netlify login`
- [ ] Deploy: `netlify deploy --prod`
- [ ] Configure build settings in `netlify.toml`:
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"
  
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```

**If using Cloudflare Pages:**
- [ ] Connect GitHub repo
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Configure environment variables

### 8.3 Backend Deployment (2-3 hours)

**If using Railway:**
- [ ] Create account at railway.app
- [ ] Install Railway CLI: `npm i -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Initialize: `railway init`
- [ ] Deploy: `railway up`
- [ ] Set environment variables in Railway dashboard:
  - `REPLICATE_API_TOKEN`
  - `NODE_ENV=production`
- [ ] Configure start command: `node dist/server/index.js`

**If using Render:**
- [ ] Create account at render.com
- [ ] Create new Web Service
- [ ] Connect GitHub repo
- [ ] Set build command: `npm run build:server`
- [ ] Set start command: `node dist/server/index.js`
- [ ] Set environment variables in Render dashboard

**If using Fly.io:**
- [ ] Install Fly CLI
- [ ] Login: `fly auth login`
- [ ] Initialize: `fly launch`
- [ ] Configure `fly.toml`
- [ ] Deploy: `fly deploy`

### 8.4 Configure CORS (30 min)

- [ ] Update backend CORS settings to allow frontend domain:
  ```typescript
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'https://yourapp.vercel.app',
      'https://yourapp.com',
    ],
    credentials: true,
  }));
  ```

### 8.5 Setup Custom Domain (1 hour)

- [ ] Add custom domain to frontend deployment
- [ ] Add custom domain to backend deployment (e.g., api.yourapp.com)
- [ ] Update DNS records
- [ ] Configure SSL certificates (usually automatic)
- [ ] Update `VITE_API_URL` in frontend to production backend URL
- [ ] Test production URLs

### 8.6 Setup Monitoring (1-2 hours)

- [ ] Configure error tracking (Sentry, LogRocket, etc.):
  ```bash
  npm install @sentry/react @sentry/tracing
  ```
- [ ] Add Sentry to frontend:
  ```typescript
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
  });
  ```
- [ ] Add Sentry to backend
- [ ] Setup uptime monitoring (UptimeRobot, Better Uptime)
- [ ] Setup performance monitoring
- [ ] Configure alerts

---

## Phase 9: Post-Migration Tasks (Week 4)

**Goal**: Ensure smooth transition

### 9.1 Verification Checklist (1-2 hours)

- [ ] All pages load without errors
- [ ] All API calls work
- [ ] SEO meta tags are correct
- [ ] Analytics tracking works
- [ ] Forms submit successfully
- [ ] No console errors
- [ ] Performance is acceptable (Lighthouse score >80)
- [ ] Mobile responsiveness maintained

### 9.2 Documentation Updates (2-3 hours)

- [ ] Update README.md with new setup instructions
- [ ] Document new development workflow
- [ ] Document deployment process
- [ ] Update API documentation
- [ ] Add troubleshooting guide
- [ ] Document environment variables

### 9.3 Team Training (2-4 hours)

- [ ] Create tRPC usage guide for team
- [ ] Walkthrough new project structure
- [ ] Explain new development commands
- [ ] Show how to debug tRPC calls
- [ ] Demonstrate React Query DevTools

### 9.4 Cleanup (1 hour)

- [ ] Remove old Next.js files:
  - [ ] `.next/` directory
  - [ ] `next.config.mjs`
  - [ ] `src/app/` directory (if moved to pages)
  - [ ] `src/actions/` directory
- [ ] Remove Next.js dependencies:
  ```bash
  npm uninstall next
  ```
- [ ] Remove `next-env.d.ts`
- [ ] Update `.gitignore` to remove Next.js entries

### 9.5 Performance Baseline (1 hour)

- [ ] Document new build times
- [ ] Document HMR speed
- [ ] Document bundle sizes
- [ ] Compare with old Next.js metrics
- [ ] Create performance dashboard

---

## Phase 10: Monitoring & Optimization (Ongoing)

**Goal**: Ensure long-term success

### 10.1 Week 1 Post-Launch (2-3 hours)

- [ ] Monitor error rates in Sentry
- [ ] Check API response times
- [ ] Monitor user feedback
- [ ] Watch server resource usage
- [ ] Check SEO rankings (may take time)
- [ ] Fix any critical bugs

### 10.2 Week 2-4 Post-Launch (1-2 hours/week)

- [ ] Analyze bundle size and optimize
- [ ] Review and optimize slow API calls
- [ ] Implement code splitting if needed
- [ ] Add progressive web app features
- [ ] Optimize images and assets
- [ ] Review and improve SEO

### 10.3 Ongoing Maintenance

- [ ] Regular dependency updates
- [ ] Security audits
- [ ] Performance monitoring
- [ ] User feedback incorporation
- [ ] A/B testing new features

---

## Rollback Plan

**If things go wrong:**

### Immediate Rollback (< 5 minutes)
- [ ] Keep old Next.js deployment running in parallel during migration
- [ ] DNS switch back to old deployment
- [ ] Or use Vercel deployment slots to instant rollback

### Partial Rollback
- [ ] Rollback only frontend or only backend
- [ ] Use feature flags to disable problematic features
- [ ] Gradual rollout to percentage of users

### Data Integrity
- [ ] No database in this app, but if you add one:
- [ ] Ensure database migrations are reversible
- [ ] Keep backups before major changes

---

## Success Metrics

### Define Success Before Starting:

| Metric | Current (Next.js) | Target (Vite) | Actual |
|--------|-------------------|---------------|--------|
| Dev Server Start Time | ~5s | <1s | ___ |
| HMR Speed | ~300ms | <100ms | ___ |
| Production Build Time | ~45s | <25s | ___ |
| Bundle Size | ___ MB | Same or smaller | ___ MB |
| Lighthouse Score | ___ | Same or better | ___ |
| Time to Interactive | ___ ms | Same or better | ___ ms |
| SEO Ranking (top keyword) | Position ___ | Maintain or improve | Position ___ |

---

## Notes & Learnings

### Things that went well:
- 

### Things that were challenging:
- 

### Things to do differently next time:
- 

### Unexpected issues:
- 

---

## Team Assignments (If Applicable)

| Phase | Assignee | Status | Due Date |
|-------|----------|--------|----------|
| Phase 1: Setup | ___ | ⚪ Not Started | ___ |
| Phase 2: Backend | ___ | ⚪ Not Started | ___ |
| Phase 3: Frontend | ___ | ⚪ Not Started | ___ |
| Phase 4: SEO | ___ | ⚪ Not Started | ___ |
| Phase 5: Styling | ___ | ⚪ Not Started | ___ |
| Phase 6: Config | ___ | ⚪ Not Started | ___ |
| Phase 7: Testing | ___ | ⚪ Not Started | ___ |
| Phase 8: Deployment | ___ | ⚪ Not Started | ___ |
| Phase 9: Post-Migration | ___ | ⚪ Not Started | ___ |

---

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Completed
- 🔴 Blocked
- ⚫ Skipped

---

**Last Updated**: January 2, 2026  
**Document Owner**: Development Team  
**Next Review Date**: ___
