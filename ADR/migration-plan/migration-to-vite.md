# Migration Plan: Next.js App Router → Vite + React Router + tRPC

**Date**: January 2, 2026  
**Status**: Planning Phase  
**Current Stack**: Next.js 14.2.4 (App Router) with Server Actions  
**Target Stack**: Vite + React Router 7 + tRPC + Express/Fastify

---

## Executive Summary

This document outlines a comprehensive migration plan from Next.js App Router to Vite with tRPC. The migration involves significant architectural changes but offers benefits in build performance, developer experience flexibility, and direct API control.

### Quick Assessment
- **Difficulty**: 🔴 **High** (7/10)
- **Time Estimate**: 2-3 weeks for a team of 2, or 4-6 weeks solo
- **Risk Level**: Medium-High (requires careful SEO handling)
- **Recommended**: Only if you need specific Vite/tRPC features or are experiencing Next.js limitations

---

## Current Architecture Analysis

### What We Have Now

1. **Framework**: Next.js 14.2.4 with App Router
2. **Routing**: File-based routing (`app/` directory)
3. **Data Fetching**: Server Actions (`"use server"` directive)
4. **API Layer**: Server Actions (`actions.ts`)
5. **AI Integration**: Replicate API (server-side)
6. **Styling**: Tailwind CSS + Radix UI components
7. **Analytics**: PostHog
8. **Key Features**:
   - 3 routes: `/`, `/quick-regex-snippets`, `/quick-regex-snippets/[id]`
   - AI regex generation via Replicate
   - Real-time regex testing
   - Static metadata generation
   - Font optimization (Next.js font system)

### Current Dependencies
```json
{
  "next": "14.2.4",
  "react": "^18",
  "react-dom": "^18",
  "replicate": "^0.30.2",
  "zod": "^3.23.8",
  // UI libraries...
}
```

---

## Proposed Architecture

### Tech Stack
```
┌─────────────────────────────────────────┐
│         Frontend (Vite + React)          │
│  - React Router 7 (or TanStack Router)  │
│  - TanStack Query (React Query)         │
│  - tRPC Client                          │
│  - Tailwind CSS + Radix UI (unchanged)  │
└─────────────────────────────────────────┘
                    ↕
              tRPC over HTTP
                    ↕
┌─────────────────────────────────────────┐
│     Backend API (Node.js Server)        │
│  - Express/Fastify                      │
│  - tRPC Server                          │
│  - Zod Validation (unchanged)           │
│  - Replicate Integration (unchanged)    │
└─────────────────────────────────────────┘
```

### New Dependencies
```json
{
  // Frontend
  "vite": "^5.x",
  "react-router-dom": "^7.x" or "@tanstack/react-router": "^1.x",
  "@tanstack/react-query": "^5.x",
  "@trpc/client": "^11.x",
  "@trpc/react-query": "^11.x",
  
  // Backend
  "@trpc/server": "^11.x",
  "express": "^4.x" or "@fastify/fastify": "^5.x",
  "@trpc/server/adapters/express" or "@trpc/server/adapters/fastify",
  
  // Development
  "vite-tsconfig-paths": "^4.x",
  "vite-plugin-html": "^3.x"
}
```

---

## Tradeoffs Analysis

## 1. SEO Implications 🔍

### ⚠️ CRITICAL: SEO Impact

| Aspect | Next.js (Current) | Vite + tRPC (Proposed) | Impact |
|--------|-------------------|------------------------|---------|
| **SSR/SSG** | ✅ Native SSR/SSG support | ❌ CSR only (without additional setup) | 🔴 **HIGH NEGATIVE** |
| **Meta Tags** | ✅ Built-in Metadata API | ⚠️ Manual (react-helmet-async) | 🟡 **MEDIUM NEGATIVE** |
| **Initial Load** | ✅ Pre-rendered HTML | ❌ Empty HTML shell + JS | 🔴 **HIGH NEGATIVE** |
| **Crawlability** | ✅ Perfect for bots | ⚠️ Depends on bot JS execution | 🟡 **MEDIUM NEGATIVE** |
| **Social Sharing** | ✅ OG tags pre-rendered | ❌ Won't work without SSR | 🔴 **HIGH NEGATIVE** |
| **Performance** | ✅ Fast FCP/LCP | ⚠️ Slower initial render | 🟡 **MEDIUM NEGATIVE** |

### SEO Mitigation Strategies

**Option 1: Accept CSR-Only** (Easiest, but SEO-poor)
- Use `react-helmet-async` for meta tags
- Rely on Google's JavaScript rendering (risky)
- **Cost**: Free
- **Effort**: Low
- **SEO Score**: 3/10 ❌

**Option 2: Vite SSR Plugin** (Medium difficulty)
- Use `vite-plugin-ssr` or `vike`
- Implement SSR for critical pages
- **Cost**: Free
- **Effort**: Medium-High (2-3 days)
- **SEO Score**: 7/10 ✅

**Option 3: Prerendering** (Good for static pages)
- Use `vite-plugin-prerender-routes`
- Pre-render static routes at build time
- **Cost**: Free
- **Effort**: Low-Medium (1 day)
- **SEO Score**: 6/10 ⚠️
- **Limitation**: Won't work for dynamic routes like `/quick-regex-snippets/[id]`

**Option 4: Use Cloudflare Workers/Vercel** (Advanced)
- Deploy with edge SSR
- Use framework adapters
- **Cost**: $$$ (depends on traffic)
- **Effort**: High (3-5 days)
- **SEO Score**: 9/10 ✅

**Option 5: Hybrid - Keep Next.js for landing pages**
- Use Next.js for SEO-critical pages (`/`, `/quick-regex-snippets`)
- Use Vite+tRPC for the interactive app portion
- **Cost**: Free
- **Effort**: Medium (architecture complexity)
- **SEO Score**: 10/10 ✅

### ⚠️ **RECOMMENDATION FOR YOUR APP**

Your app is a **regex tool** with:
- Landing page (SEO important for discoverability)
- Tool pages (SEO less critical - users come for functionality)
- Dynamic routes (`/quick-regex-snippets/[id]`)

**Best Choice**: **Option 3 (Prerendering) + Option 5 considerations**
- Pre-render landing page and static snippet list
- Accept CSR for individual snippet pages (less critical for SEO)
- Focus on performance and UX for the tool itself

---

## 2. Developer Experience (DX) 💻

### Build Performance

| Metric | Next.js | Vite | Winner |
|--------|---------|------|---------|
| **Cold Start** | 3-8s | 0.3-1s | 🟢 **Vite** (10x faster) |
| **HMR** | 200-500ms | 50-150ms | 🟢 **Vite** (3-4x faster) |
| **Production Build** | 30-60s | 15-30s | 🟢 **Vite** (2x faster) |
| **Bundle Size** | Optimized | Optimized | 🟡 **Tie** |

### Code Patterns

| Aspect | Next.js Server Actions | tRPC | Assessment |
|--------|----------------------|------|------------|
| **Type Safety** | ✅ Basic (actions are typed) | ✅✅ **End-to-end** (client → server) | 🟢 **tRPC wins** |
| **DX - Autocomplete** | ⚠️ Manual type imports | ✅✅ **Automatic inference** | 🟢 **tRPC wins** |
| **Learning Curve** | 🟢 Low (just functions) | 🟡 Medium (new concepts) | 🟢 **Next.js wins** |
| **Debugging** | ⚠️ Server/client boundary unclear | ✅ Clear separation | 🟢 **tRPC wins** |
| **Error Handling** | ⚠️ Manual try-catch | ✅ Built-in error types | 🟢 **tRPC wins** |
| **Caching** | ⚠️ Manual or use cache() | ✅ React Query built-in | 🟢 **tRPC wins** |
| **Optimistic Updates** | ⚠️ Manual | ✅ React Query helpers | 🟢 **tRPC wins** |
| **Real-time** | ❌ Not built-in | ✅ WebSocket subscriptions | 🟢 **tRPC wins** |

### Code Example Comparison

**Current (Next.js Server Actions)**
```typescript
// actions/actions.ts
"use server";
export async function submitForm(formData: FormData): Promise<GeneratorFormResponse> {
  const data = { description: formData.get("description") as string };
  const validatedData = formDataSchema.parse(data);
  const result = await generateRegexWithAIUseCase(validatedData);
  return result;
}

// Component
import { submitForm } from "@/actions/actions";
const result = await submitForm(formData); // No autocomplete on 'result' type
```

**Proposed (tRPC)**
```typescript
// server/routers/regex.ts
export const regexRouter = router({
  generate: publicProcedure
    .input(formDataSchema)
    .mutation(async ({ input }) => {
      return await generateRegexWithAIUseCase(input);
    }),
});

// Component
import { trpc } from "@/lib/trpc";
const mutation = trpc.regex.generate.useMutation();
// ✅ Full autocomplete on mutation.data
// ✅ Automatic loading/error states
// ✅ Built-in retry and caching
await mutation.mutateAsync(formData);
```

### DX Verdict

| Feature | Winner | Margin |
|---------|--------|--------|
| Build Speed | Vite | 🟢🟢🟢 Huge |
| Type Safety | tRPC | 🟢🟢 Significant |
| Learning Curve | Next.js | 🟢 Slight |
| Debugging | tRPC | 🟢 Moderate |
| Overall DX | **tRPC + Vite** | 🟢🟢 **Strong Win** |

---

## 3. Migration Difficulty Assessment

### Complexity Breakdown

| Task | Difficulty | Time Estimate | Blockers |
|------|-----------|---------------|----------|
| **Setup Vite + React Router** | 🟡 Medium | 4-6 hours | Route migration pattern |
| **Setup tRPC Server** | 🟡 Medium | 4-6 hours | Learning tRPC concepts |
| **Migrate Server Actions → tRPC** | 🟢 Easy | 2-3 hours | Direct mapping |
| **File-based routing → React Router** | 🟡 Medium | 3-4 hours | Manual route config |
| **Metadata → react-helmet** | 🟢 Easy | 1-2 hours | Simple replacement |
| **SSR/Prerendering Setup** | 🔴 Hard | 1-2 days | Complex configuration |
| **Font optimization** | 🟡 Medium | 2-3 hours | Manual @font-face |
| **Environment variables** | 🟢 Easy | 30 min | Rename `NEXT_PUBLIC_` → `VITE_` |
| **Testing & debugging** | 🟡 Medium | 2-3 days | Integration issues |
| **Deployment reconfiguration** | 🟡 Medium | 2-4 hours | Different build output |

### Technical Challenges

**1. Routing Migration**
- Next.js: File-based, automatic
- React Router: Manual configuration
```typescript
// Need to create routes config manually
const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/quick-regex-snippets", element: <SnippetsPage /> },
  { path: "/quick-regex-snippets/:id", element: <SnippetDetailPage /> },
]);
```

**2. Data Fetching Pattern Change**
```typescript
// Before: Server Action (automatic)
const result = await submitForm(formData);

// After: tRPC with React Query (more boilerplate, but more power)
const mutation = trpc.regex.generate.useMutation();
const result = await mutation.mutateAsync(formData);
```

**3. Metadata Management**
```tsx
// Before: Automatic
export const metadata = { title: "...", description: "..." };

// After: Manual per route
<Helmet>
  <title>...</title>
  <meta name="description" content="..." />
</Helmet>
```

**4. Build Output Structure**
- Next.js: `.next/` folder, ready for deployment
- Vite: `dist/` folder, needs separate backend deployment

### Overall Difficulty: 🔴 **7/10 (High)**

**Why it's hard:**
- Architectural shift from monolith to client-server
- SEO requires additional setup (SSR/prerendering)
- Deployment becomes more complex (frontend + backend)
- Need to learn tRPC patterns

**Why it's manageable:**
- Application is small (3 routes)
- Logic is well-separated (use-cases already exist)
- No complex Next.js features (no middleware, no ISR, etc.)
- UI components are framework-agnostic

---

## 4. Pros & Cons Summary

### ✅ Pros of Migrating to Vite + tRPC

1. **⚡ Much Faster Development**
   - 10x faster cold starts
   - 3-4x faster HMR
   - Near-instant feedback loop

2. **🔒 Superior Type Safety**
   - End-to-end type safety from client to server
   - Zero manual type imports needed
   - Autocomplete everywhere

3. **🎯 Better Data Management**
   - React Query built-in (caching, optimistic updates)
   - Clear loading/error states
   - Request deduplication

4. **🔌 More Control**
   - Full control over API routes
   - Easier to add WebSockets, SSE
   - Can integrate with any backend

5. **📦 Smaller Learning Surface**
   - No "Next.js magic" to learn
   - Standard React patterns
   - Explicit over implicit

6. **💰 Potentially Cheaper Hosting**
   - Static frontend → Any CDN
   - Backend → Any Node host
   - More deployment options

### ❌ Cons of Migrating to Vite + tRPC

1. **🔍 SEO Significantly Harder**
   - No SSR by default
   - Need to add prerendering manually
   - Social sharing may break

2. **📚 More Complex Architecture**
   - Separate frontend/backend codebases
   - Need to manage CORS
   - More moving parts

3. **⏱️ Significant Time Investment**
   - 4-6 weeks of work
   - Learning curve for tRPC
   - Testing/QA needed

4. **🚀 More Complex Deployment**
   - Need to deploy 2 apps (frontend + backend)
   - Environment coordination
   - More configuration

5. **🛠️ Loss of Next.js Niceties**
   - No automatic image optimization
   - No automatic font optimization
   - No automatic code splitting by route (can still be done, but manual)

6. **📖 Smaller Ecosystem**
   - Fewer tutorials/guides
   - Smaller community
   - Need to build more yourself

---

## 5. When Should You Migrate?

### ✅ **DO Migrate If:**

- [ ] You're experiencing slow Next.js build times (>1min)
- [ ] You need real-time features (WebSockets, SSE)
- [ ] You want full control over your API layer
- [ ] You're building a tool/dashboard (not content site)
- [ ] You have time for a 4-6 week project
- [ ] You're comfortable with more complex architecture
- [ ] SEO is not your primary concern (or you can add SSR later)
- [ ] You want better DX with type safety

### ❌ **DON'T Migrate If:**

- [ ] SEO is critical for your business
- [ ] You need to ship features quickly (tight deadline)
- [ ] Your team is unfamiliar with tRPC/React Router
- [ ] You're happy with current Next.js DX
- [ ] You don't have time to maintain 2 deployments
- [ ] Your app is mostly content/marketing pages
- [ ] Build times are acceptable (<1min)

### 🤔 **For Your Regex App Specifically:**

**Context:**
- It's a tool (not a blog/marketing site)
- SEO matters for landing page discoverability
- User experience during tool usage is key
- Small app (only 3 routes)

**Verdict:** 🟡 **MAYBE - Depends on your priorities**

**If your priority is:**
- 🎯 **Best DX + fast iteration** → ✅ Migrate
- 🔍 **Maximum SEO + organic growth** → ❌ Stay with Next.js
- ⚖️ **Balanced approach** → ✅ Migrate with prerendering

---

## 6. Alternative: Hybrid Approach

### Option: "Best of Both Worlds"

Keep the architecture split:

```
┌───────────────────────────────────┐
│   Next.js (Marketing + SEO)       │
│   - Landing page (/)              │
│   - Blog/docs (if added later)    │
│   Routes: Static/SSR pages        │
└───────────────────────────────────┘
             │
             └─→ Link to →
                           ┌─────────────────────────────────┐
                           │   Vite + tRPC (App Tool)        │
                           │   - Regex playground            │
                           │   - Quick snippets              │
                           │   Routes: Interactive features  │
                           └─────────────────────────────────┘
```

**Pros:**
- ✅ Best SEO (Next.js for landing)
- ✅ Best DX (Vite for tool)
- ✅ Clear separation of concerns

**Cons:**
- ❌ Two codebases to maintain
- ❌ Shared component complexity
- ❌ More complex deployment

---

## 7. Recommended Decision Framework

### Score Your Priorities (1-10)

| Priority | Score | Weight |
|----------|-------|--------|
| SEO performance | ___/10 | High |
| Developer experience | ___/10 | High |
| Build speed | ___/10 | Medium |
| Time to ship features | ___/10 | High |
| Architecture control | ___/10 | Low |
| Learning new tech | ___/10 | Low |

**Decision Guide:**
- If SEO score > 7: **Stay with Next.js** or use prerendering
- If DX + Build speed > 14 combined: **Migrate to Vite**
- If Time to ship > 8: **Don't migrate now**

---

## 8. Migration Strategy (If Proceeding)

### Phase 1: Foundation (Week 1)
1. Setup Vite project structure
2. Configure TypeScript, paths, tailwind
3. Setup basic React Router
4. Migrate UI components (no logic changes)
5. Setup tRPC server with Express/Fastify

### Phase 2: Logic Migration (Week 2)
1. Create tRPC routers from server actions
2. Migrate use-cases to backend
3. Setup React Query + tRPC client
4. Connect components to tRPC
5. Test all API calls

### Phase 3: Routes & SEO (Week 3)
1. Implement all React Router routes
2. Setup react-helmet for metadata
3. Configure prerendering for static pages
4. Test routing and navigation
5. Verify SEO tags

### Phase 4: Polish & Deploy (Week 4)
1. Environment variable setup
2. Production build optimization
3. Setup separate deployments
4. Testing and QA
5. Monitoring setup
6. Go live with DNS switch

### Parallel Work (Throughout)
- Documentation updates
- Team training on tRPC
- Performance monitoring
- Rollback plan preparation

---

## 9. Risk Mitigation

### Critical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SEO drops | High | High | Prerendering + monitoring |
| Downtime during migration | Medium | High | Blue-green deployment |
| Team learning curve | Medium | Medium | Training + documentation |
| Integration bugs | High | Medium | Comprehensive testing |
| Performance regression | Low | Medium | Load testing |
| Cost increase | Low | Low | Budget planning |

### Rollback Plan

1. Keep Next.js deployment running in parallel
2. Use feature flags for gradual rollout
3. DNS switch makes rollback instant
4. Keep old codebase for 3 months post-migration

---

## 10. Cost Analysis

### Development Time
- **Solo developer**: 4-6 weeks full-time
- **Team of 2**: 2-3 weeks
- **Opportunity cost**: Features not shipped during migration

### Hosting (Monthly Estimates)

| Service | Next.js (Current) | Vite + tRPC | Difference |
|---------|-------------------|-------------|------------|
| **Vercel (All-in-one)** | $20-50 | N/A | - |
| **Frontend CDN** | Included | $5-10 (Cloudflare/Netlify) | +$5-10 |
| **Backend API** | Included | $15-30 (Railway/Render) | +$15-30 |
| **Total** | **$20-50** | **$20-40** | **±$0-20** |

Or cheaper alternative:
- Frontend: Cloudflare Pages (free tier)
- Backend: Render.com (free tier) or Railway ($5)
- **Total**: **$0-5/month** 🎉

---

## 11. Final Recommendation

### For Your Regex Tool App: 🟡 **CONDITIONAL RECOMMENDATION**

**Recommended Path: "Phased Approach"**

1. **Short-term (Now - 1 month)**
   - ❌ **Don't migrate** immediately
   - ✅ Stay with Next.js
   - Focus on features and user growth
   - Collect data on build time pain points

2. **Medium-term (3-6 months)**
   - ✅ **Migrate if:**
     - Build times become painful (>1min)
     - You need real-time features
     - Team wants better DX
   - 🎯 **Choose prerendering strategy for SEO**
   - Use this migration plan as guide

3. **Long-term (6+ months)**
   - Consider hybrid approach
   - Split marketing (Next.js) from tool (Vite)
   - Evaluate based on traffic and growth

### Bottom Line

> **Next.js is perfectly fine for your use case.** Only migrate to Vite + tRPC if you have a specific pain point that it solves. The grass isn't always greener.

However, if you do migrate:
- Vite will give you a much faster development experience
- tRPC will give you superior type safety and API DX
- You'll need to invest time in SEO solutions
- You'll have more architectural flexibility

---

## 12. Additional Resources

### Learning Resources
- [tRPC Documentation](https://trpc.io/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router 7 Docs](https://reactrouter.com/en/main)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Vike (Vite SSR)](https://vike.dev/)

### Similar Migrations (Case Studies)
- [t3-app: tRPC + Next.js](https://create.t3.gg/) - Alternative: tRPC WITH Next.js
- [Cal.com: tRPC migration](https://cal.com/blog/trpc)
- Companies using Vite: Shopify, Stripe, Google

### Tools
- [vite-plugin-ssr](https://vite-plugin-ssr.com/) - SSR for Vite
- [vite-plugin-prerender](https://github.com/mswjs/vite-plugin-prerender)
- [tRPC Playground](https://trpc.io/docs/playground)

---

## Appendix A: Detailed File Migration Map

Will be created in separate TODO file with step-by-step checklist.

---

**Document Owner**: Development Team  
**Last Updated**: January 2, 2026  
**Status**: ✅ Planning Complete - Awaiting Decision
