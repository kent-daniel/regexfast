# TanStack Start Analysis: The "Best of Both Worlds" Option

**Date**: January 2, 2026  
**Status**: Alternative Evaluation  
**Option**: Next.js → TanStack Start  
**TanStack Start Version**: 1.x (Beta/Stable)

---

## What is TanStack Start?

TanStack Start is a **full-stack React framework** built on top of:
- **Vite** (fast builds & HMR)
- **TanStack Router** (type-safe routing)
- **Vinxi** (server infrastructure)
- Built-in support for **Server Functions** (like Next.js Server Actions)
- Native **SSR/SSG** capabilities
- Optional **tRPC** integration

Think of it as: **"Vite + Next.js App Router features + TanStack ecosystem"**

### Quick Comparison

| Feature | Next.js | TanStack Start | Vite + tRPC |
|---------|---------|----------------|-------------|
| **SSR/SSG** | ✅ Built-in | ✅ Built-in | ❌ Manual setup |
| **Dev Speed** | 🟡 Moderate | 🟢 Fast (Vite) | 🟢 Fast (Vite) |
| **Type Safety** | 🟡 Good | 🟢 Excellent | 🟢 Excellent |
| **File Routing** | ✅ Built-in | ✅ Built-in | ❌ Manual |
| **SEO** | 🟢 Excellent | 🟢 Excellent | 🔴 Poor (without work) |
| **Learning Curve** | 🟢 Low | 🟡 Medium | 🔴 High |
| **Maturity** | 🟢 Production | 🟡 New (v1) | 🟢 Production |
| **Ecosystem** | 🟢 Huge | 🟡 Growing | 🟢 Good |

---

## Why TanStack Start Could Be Perfect For You

### ✅ Advantages Over Vite + tRPC

1. **Keeps SSR/SEO** 🔍
   - No SEO regression like pure Vite approach
   - Server-side rendering out of the box
   - Static generation supported
   - Meta tags work properly

2. **Simpler Architecture** 🏗️
   - No separate backend to deploy
   - Single codebase (like Next.js)
   - Server functions instead of separate tRPC server
   - Easier deployment

3. **Better Type Safety** 🔒
   - TanStack Router has full type inference
   - Route params automatically typed
   - Search params typed
   - Better than Next.js App Router

4. **Vite Speed** ⚡
   - Same fast HMR as Vite
   - ~10x faster than Next.js dev server
   - Near-instant feedback

### ✅ Advantages Over Next.js

1. **Much Faster Development** ⚡
   - Vite-powered (0.3-1s cold start vs 3-8s)
   - Faster HMR (50-150ms vs 200-500ms)
   - Better developer experience

2. **Superior Type Safety** 🔒
   - End-to-end type inference
   - Route parameters automatically typed
   - Search params typed
   - Loader/action data typed

3. **More Flexible** 🎯
   - Not locked into Vercel ecosystem
   - Can deploy anywhere
   - More control over server behavior
   - Can easily add tRPC if needed

4. **Better DX Features** 💻
   - TanStack Router DevTools
   - TanStack Query built-in
   - Better error boundaries
   - Suspense-first approach

---

## Architecture with TanStack Start

```
┌─────────────────────────────────────────────────┐
│         TanStack Start Application              │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Frontend (React + TanStack Router)      │  │
│  │  - File-based routing                    │  │
│  │  - Type-safe navigation                  │  │
│  │  - TanStack Query integration            │  │
│  └──────────────────────────────────────────┘  │
│                     ↕                           │
│  ┌──────────────────────────────────────────┐  │
│  │  Server Functions (Built-in)             │  │
│  │  - createServerFn()                      │  │
│  │  - Similar to Server Actions             │  │
│  │  - Automatic client-server bridge        │  │
│  └──────────────────────────────────────────┘  │
│                     ↕                           │
│  ┌──────────────────────────────────────────┐  │
│  │  Server Runtime (Vinxi)                  │  │
│  │  - SSR/SSG                               │  │
│  │  - API routes                            │  │
│  │  - Replicate integration                 │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         Single deployment, Vite-powered
```

---

## Migration Comparison

### Difficulty Comparison

| Aspect | Next.js → TanStack Start | Next.js → Vite + tRPC |
|--------|-------------------------|----------------------|
| **Overall Difficulty** | 🟡 **Medium (5/10)** | 🔴 **High (7/10)** |
| **Time Estimate** | **2-3 weeks** | **4-6 weeks** |
| **Architecture Change** | 🟢 Minimal (still monolith) | 🔴 Major (client-server split) |
| **SEO Complexity** | 🟢 No change needed | 🔴 Significant work |
| **Deployment** | 🟢 Simple (single app) | 🔴 Complex (two apps) |
| **Learning Curve** | 🟡 Medium | 🔴 High |
| **Risk Level** | 🟡 Medium | 🔴 Medium-High |

### Why TanStack Start is Easier

1. **Keep existing architecture** (monolith)
2. **No SEO work needed** (SSR built-in)
3. **Simpler deployment** (one app, not two)
4. **Server Functions** are similar to Server Actions
5. **File-based routing** similar to Next.js

---

## Code Migration Examples

### Current (Next.js Server Action)

```typescript
// src/actions/actions.ts
"use server";
export async function getRegexMatches(
  pattern: string,
  text: string,
  flag: string
) {
  const { matches } = await getRegexUseCase(pattern, text, flag);
  return matches;
}

// Component
import { getRegexMatches } from "@/actions/actions";
const matches = await getRegexMatches(pattern, text, flag);
```

### TanStack Start (Server Function)

```typescript
// src/server/regex.ts
import { createServerFn } from '@tanstack/start';
import { getRegexUseCase } from './use-cases/use-cases';

export const getRegexMatches = createServerFn('POST', async (data: {
  pattern: string;
  text: string;
  flag: string;
}) => {
  const { matches } = await getRegexUseCase(data.pattern, data.text, data.flag);
  return matches;
});

// Component - Option 1: Direct call
import { getRegexMatches } from '@/server/regex';
const matches = await getRegexMatches({ pattern, text, flag });

// Component - Option 2: With TanStack Query
const { data: matches } = useQuery({
  queryKey: ['regex-matches', pattern, text, flag],
  queryFn: () => getRegexMatches({ pattern, text, flag }),
});
```

**Key Difference**: Very similar! Just wrap with `createServerFn()` instead of `"use server"`

---

### Routing Migration

#### Next.js App Router

```typescript
// app/page.tsx
export default function HomePage() { /* ... */ }

// app/quick-regex-snippets/page.tsx
export default function SnippetsPage() { /* ... */ }

// app/quick-regex-snippets/[id]/page.tsx
export default function SnippetDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  // ...
}
```

#### TanStack Start

```typescript
// routes/index.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() { /* ... */ }

// routes/quick-regex-snippets.tsx
export const Route = createFileRoute('/quick-regex-snippets')({
  component: SnippetsPage,
});

// routes/quick-regex-snippets/$id.tsx
export const Route = createFileRoute('/quick-regex-snippets/$id')({
  component: SnippetDetail,
});

function SnippetDetail() {
  const { id } = Route.useParams(); // ✅ Fully typed!
  // ...
}
```

**Key Difference**: Different file naming (`$id` instead of `[id]`), but conceptually identical

---

### Metadata/SEO

#### Next.js

```typescript
export const metadata: Metadata = {
  title: "Quick Snippets",
  description: "...",
};
```

#### TanStack Start

```typescript
export const Route = createFileRoute('/quick-regex-snippets')({
  component: SnippetsPage,
  meta: () => [
    { title: 'Quick Snippets' },
    { name: 'description', content: '...' },
  ],
});

// Or use react-helmet-async (same as Vite approach)
import { Helmet } from 'react-helmet-async';

function SnippetsPage() {
  return (
    <>
      <Helmet>
        <title>Quick Snippets</title>
        <meta name="description" content="..." />
      </Helmet>
      {/* ... */}
    </>
  );
}
```

---

## Tradeoffs: TanStack Start Specifically

### ✅ Pros

1. **Best Developer Experience** 🏆
   - Vite speed + full-stack capabilities
   - Type-safe routing out of the box
   - Excellent DevTools
   - Better than both Next.js and Vite+tRPC

2. **No SEO Regression** 🔍
   - SSR/SSG built-in
   - Keep all current SEO benefits
   - No extra work needed

3. **Easier Migration** ⏱️
   - 2-3 weeks vs 4-6 weeks for Vite+tRPC
   - More similar to Next.js
   - Less architectural change

4. **Single Deployment** 🚀
   - No need for separate frontend/backend
   - Simpler deployment than Vite+tRPC
   - Can still deploy anywhere

5. **Modern Stack** 🆕
   - Latest React patterns
   - Suspense-first
   - Better streaming SSR
   - Modern build pipeline

6. **Flexibility** 🎯
   - Can add tRPC later if needed
   - Not locked to Vercel
   - More control than Next.js

### ❌ Cons

1. **New Framework (v1)** ⚠️
   - Less mature than Next.js
   - Smaller community
   - Fewer tutorials/guides
   - Potential bugs/breaking changes
   - **RISK**: You're an early adopter

2. **Smaller Ecosystem** 📦
   - Fewer plugins than Next.js
   - Less third-party integration examples
   - Need to build more yourself
   - Limited Stackoverflow answers

3. **Learning Curve** 📚
   - Need to learn TanStack Router concepts
   - Different patterns from Next.js
   - Server Functions API is new
   - Team needs training

4. **Deployment Options** 🚢
   - Not as optimized for Vercel as Next.js
   - Need to configure SSR adapters
   - More manual setup than Next.js
   - (But still easier than Vite+tRPC)

5. **Unknown Production Stability** 🔬
   - Less battle-tested at scale
   - Unknown edge cases
   - May have performance issues
   - No proven track record yet

6. **Migration Path** 🛣️
   - If TanStack Start doesn't work out, harder to pivot
   - Next.js → TanStack Start → back to Next.js = wasted effort
   - Vite+tRPC is more standard

---

## When to Choose TanStack Start

### ✅ Choose TanStack Start If:

- [ ] You want Vite's speed without losing SSR/SEO
- [ ] You value type safety and DX over ecosystem size
- [ ] You're comfortable being an early adopter
- [ ] You like the TanStack ecosystem (Query, Router, etc.)
- [ ] You want a middle-ground between Next.js and Vite+tRPC
- [ ] You have 2-3 weeks for migration
- [ ] You're building a tool/app (not a marketing site)
- [ ] You're okay with less community support

### ❌ Don't Choose TanStack Start If:

- [ ] You need a proven, battle-tested solution
- [ ] Your team is risk-averse
- [ ] You need lots of third-party integrations
- [ ] You want maximum community support
- [ ] You can't afford potential bugs/breaking changes
- [ ] You need enterprise-level stability
- [ ] Your stakeholders won't approve "experimental" tech

---

## The Three Options Compared

### Quick Decision Matrix

| Priority | Next.js (Current) | TanStack Start | Vite + tRPC |
|----------|-------------------|----------------|-------------|
| **Stability** | 🟢🟢🟢 Best | 🟡 Unknown | 🟢🟢 Good |
| **Dev Speed** | 🟡 Okay | 🟢🟢🟢 Best | 🟢🟢🟢 Best |
| **Type Safety** | 🟡🟡 Good | 🟢🟢🟢 Best | 🟢🟢🟢 Best |
| **SEO** | 🟢🟢🟢 Best | 🟢🟢🟢 Best | 🔴 Poor (extra work) |
| **Ecosystem** | 🟢🟢🟢 Best | 🟡 Small | 🟢🟢 Good |
| **Migration Ease** | N/A | 🟢🟢 Medium | 🔴 Hard |
| **Deployment** | 🟢🟢🟢 Easiest | 🟢🟢 Easy | 🟡 Complex |
| **Community** | 🟢🟢🟢 Huge | 🟡 Small | 🟢🟢 Good |
| **DX Features** | 🟡🟡 Good | 🟢🟢🟢 Best | 🟢🟢 Great |
| **Risk** | 🟢 None | 🔴 High (new) | 🟡 Medium |

### Time Investment

| Option | Time Needed | Difficulty | Risk |
|--------|-------------|------------|------|
| **Stay with Next.js** | 0 weeks | N/A | 🟢 None |
| **TanStack Start** | 2-3 weeks | 5/10 | 🔴 High (newness) |
| **Vite + tRPC** | 4-6 weeks | 7/10 | 🟡 Medium (complexity) |

### ROI Analysis

**TanStack Start**
- **Investment**: 2-3 weeks
- **Gain**: Better DX, faster builds, better types
- **Loss**: Stability, community support
- **ROI**: ⚠️ **Moderate-High risk, high reward**

**Vite + tRPC**
- **Investment**: 4-6 weeks
- **Gain**: Maximum flexibility, proven stack, best DX
- **Loss**: SEO effort, deployment complexity
- **ROI**: 🟢 **Lower risk, proven reward**

**Stay with Next.js**
- **Investment**: 0 weeks
- **Gain**: Keep shipping features
- **Loss**: Slower builds, less type safety
- **ROI**: 🟢 **No risk, no reward (but safe)**

---

## Migration Complexity: Detailed Breakdown

### What's Similar to Next.js

| Feature | Similarity | Notes |
|---------|-----------|-------|
| File-based routing | 90% | Just different file naming |
| Server functions | 85% | Similar to Server Actions |
| SSR/SSG | 95% | Nearly identical |
| Layouts | 90% | Same concept |
| Loading states | 80% | Uses Suspense |
| Error handling | 85% | Similar error boundaries |

### What's Different

| Feature | Difference Level | Learning Needed |
|---------|------------------|-----------------|
| Route file format | Medium | 2-3 hours |
| Server function API | Low | 1-2 hours |
| Navigation API | Medium | 2-3 hours |
| Build config | Medium | 2-3 hours |
| Deployment | High | 4-6 hours |
| DevTools | Low | 1 hour |

### Estimated Migration Time

| Phase | Time | Notes |
|-------|------|-------|
| **Setup & Config** | 1 day | Install, configure Vite/TanStack Start |
| **Routing Migration** | 1-2 days | Convert routes to TanStack Router |
| **Server Functions** | 1 day | Convert Server Actions |
| **Components** | 1 day | Minimal changes needed |
| **Metadata/SEO** | 0.5 days | Update meta tags |
| **Testing** | 2-3 days | Thorough testing |
| **Deployment** | 1 day | Setup deployment pipeline |
| **Buffer** | 2-3 days | Unexpected issues |
| **TOTAL** | **10-15 days** | **2-3 weeks** |

---

## TanStack Start: Code Structure

### Project Structure

```
regexfast/
├── package.json
├── vite.config.ts
├── app.config.ts (TanStack Start config)
├── public/
│   └── (static assets)
└── app/
    ├── routes/
    │   ├── __root.tsx (root layout)
    │   ├── index.tsx (/)
    │   ├── quick-regex-snippets.tsx (/quick-regex-snippets)
    │   └── quick-regex-snippets.$id.tsx (/quick-regex-snippets/$id)
    ├── components/
    │   └── (all your components - unchanged)
    ├── server/
    │   ├── regex.ts (server functions)
    │   └── use-cases/
    │       └── use-cases.ts
    └── router.tsx
```

### Example Files

**app.config.ts**
```typescript
import { defineConfig } from '@tanstack/start/config';

export default defineConfig({
  server: {
    preset: 'node-server', // or 'vercel', 'netlify', etc.
  },
  vite: {
    // Vite config here
  },
});
```

**routes/__root.tsx**
```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import Background from '@/components/Background';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <Background />
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
```

**routes/index.tsx**
```typescript
import { createFileRoute } from '@tanstack/react-router';
import Hero from '@/components/Hero';
import { RegexPlaygroundSection } from '@/components/RegexPlaygroundSection';
import CommonRegexSection from '@/components/CommonRegexSection';
import FAQSection from '@/components/FAQSection';

export const Route = createFileRoute('/')({
  component: HomePage,
  meta: () => [
    { title: 'Magic Regex Generator' },
    { 
      name: 'description',
      content: 'Generate and test regular expressions effortlessly...'
    },
  ],
});

function HomePage() {
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

**server/regex.ts**
```typescript
import { createServerFn } from '@tanstack/start';
import { z } from 'zod';
import { getRegexUseCase, generateRegexWithAIUseCase } from './use-cases/use-cases';

const getMatchesSchema = z.object({
  pattern: z.string(),
  text: z.string(),
  flag: z.string(),
});

export const getRegexMatches = createServerFn('POST', async (input: unknown) => {
  const { pattern, text, flag } = getMatchesSchema.parse(input);
  
  if (text.length === 0 || pattern.length === 0) {
    return { status: 'invalid', timeSpent: '0', matches: [] };
  }
  
  const { status, timeSpent, matches } = await getRegexUseCase(pattern, text, flag);
  return { status, timeSpent: timeSpent.toFixed(2), matches };
});

const generateRegexSchema = z.object({
  description: z.string().min(1),
  shouldMatch: z.array(z.string()),
  shouldNotMatch: z.array(z.string()).optional(),
  info: z.string().optional(),
});

export const generateRegex = createServerFn('POST', async (input: unknown) => {
  const data = generateRegexSchema.parse(input);
  return await generateRegexWithAIUseCase(data);
});
```

---

## Deployment Options for TanStack Start

### Option 1: Vercel (Easiest)

```bash
# Works out of the box
vercel deploy
```

- ✅ Zero config
- ✅ Automatic SSR
- ✅ Edge functions
- 💰 $20-50/month

### Option 2: Netlify

```bash
npm install -D @tanstack/start-adapter-netlify
```

- ✅ Netlify Functions support
- ✅ Edge functions
- 💰 $0-20/month

### Option 3: Node Server (Railway, Render, Fly.io)

```bash
npm install -D @tanstack/start-adapter-node
```

- ✅ Works anywhere Node runs
- ✅ Full control
- 💰 $5-30/month

### Option 4: Cloudflare Workers

```bash
npm install -D @tanstack/start-adapter-cloudflare-workers
```

- ✅ Edge deployment
- ✅ Very fast
- 💰 $0-10/month

---

## Potential Issues & Solutions

### Issue 1: TanStack Start is Beta/New

**Risk**: Breaking changes, bugs, incomplete docs

**Mitigation**:
- Pin versions strictly in package.json
- Join TanStack Discord for quick support
- Be prepared to work around issues
- Have rollback plan to Next.js

### Issue 2: Fewer Examples

**Risk**: Harder to find solutions to problems

**Mitigation**:
- Read official docs thoroughly
- Study example apps in TanStack Start repo
- Join community Discord
- Be willing to read source code

### Issue 3: Unknown Performance at Scale

**Risk**: May have performance issues you won't discover until production

**Mitigation**:
- Load test before launch
- Monitor performance closely
- Have fallback to CDN for static assets
- Keep Next.js deployment available for rollback

### Issue 4: Team Unfamiliarity

**Risk**: Team struggles with new concepts

**Mitigation**:
- Allocate time for learning
- Pair programming during migration
- Create internal docs
- Start with pilot feature

---

## Decision Framework: Which Option?

### Score Your Situation

| Factor | Weight | Next.js | TanStack Start | Vite+tRPC |
|--------|--------|---------|----------------|-----------|
| **Need SSR/SEO** (1-10) | x3 | 10 | 10 | 2 |
| **Value DX/Speed** (1-10) | x2 | 5 | 10 | 10 |
| **Risk Tolerance** (1-10) | x3 | 10 | 3 | 6 |
| **Time Available** (1-10) | x2 | 10 | 6 | 3 |
| **Team Skill** (1-10) | x1 | 8 | 5 | 4 |

### Recommendation Logic

**If you scored:**
- **Next.js highest**: Stay with Next.js (safest choice)
- **TanStack Start highest**: Migrate to TanStack Start (balanced risk/reward)
- **Vite+tRPC highest**: Go with pure Vite+tRPC (maximum flexibility)

### For Your Regex App

**My Assessment** (based on what I know):

| Factor | Your Situation | Best Option |
|--------|----------------|-------------|
| SEO Importance | Medium-High (landing page) | Next.js or TanStack |
| DX Priority | Unknown | Any works |
| Risk Tolerance | Unknown | If high: TanStack, If low: Next.js |
| Time Available | 4-6 weeks mentioned | All feasible |
| Team Size | Solo or small | TanStack (easier) |
| Current Pain | Build speed? | If yes: TanStack |

---

## Final Recommendation: Three Scenarios

### Scenario 1: "I want to stay productive NOW"
**→ Stay with Next.js**
- ✅ Keep shipping features
- ✅ Zero migration cost
- ✅ Proven stability
- ⏱️ Time saved: 2-6 weeks

### Scenario 2: "I want better DX but don't want much risk"
**→ Wait 3-6 months, then consider TanStack Start**
- ✅ Let TanStack Start mature
- ✅ More examples will exist
- ✅ Community will grow
- ⏱️ Better timing

### Scenario 3: "I want the best DX and I'm okay with risk"
**→ Migrate to TanStack Start NOW**
- ✅ Best of both worlds (SSR + Vite speed)
- ✅ Easier than Vite+tRPC
- ⚠️ Accept early adopter risks
- ⏱️ 2-3 weeks investment

### Scenario 4: "I want maximum control and proven stack"
**→ Migrate to Vite + tRPC**
- ✅ Battle-tested stack
- ✅ Maximum flexibility
- ⚠️ Hardest migration
- ⏱️ 4-6 weeks investment

---

## My Personal Recommendation

For your specific app (regex tool with 3 routes):

### 🏆 **Top Choice: Stay with Next.js for now**

**Why:**
1. Next.js is working fine for your use case
2. TanStack Start is too new (risky)
3. You haven't mentioned specific pain points
4. Better to ship features than migrate

### 🥈 **Second Choice: TanStack Start in 6 months**

**Why:**
1. By mid-2026, TanStack Start will be more mature
2. More tutorials and examples will exist
3. Bugs will be ironed out
4. You'll know if it's proven or not

### 🥉 **Third Choice: Vite + tRPC if you have specific needs**

**Why:**
1. Only if you need real-time features
2. Only if build times are actually painful
3. Only if you want a proven stack with maximum control

---

## TanStack Start Migration TODO

**If you decide to migrate to TanStack Start, I can create a detailed migration TODO similar to the Vite+tRPC one.**

Estimated sections:
1. Setup TanStack Start project (1 day)
2. Migrate routes to TanStack Router (1-2 days)
3. Convert Server Actions to Server Functions (1 day)
4. Update components (1 day)
5. Configure deployment (1 day)
6. Testing (2-3 days)
7. Launch (1 day)

**Total: 2-3 weeks**

---

## Resources

### Official Documentation
- [TanStack Start Docs](https://tanstack.com/start)
- [TanStack Router Docs](https://tanstack.com/router)
- [TanStack Start GitHub](https://github.com/TanStack/router)

### Community
- [TanStack Discord](https://discord.com/invite/tanstack)
- [TanStack Twitter](https://twitter.com/tannerlinsley)

### Examples
- [TanStack Start Examples](https://github.com/TanStack/router/tree/main/examples/react/start)
- [Start Counter Example](https://github.com/TanStack/router/tree/main/examples/react/start-counter)

### Comparisons
- [TanStack Start vs Next.js](https://tanstack.com/router/latest/docs/framework/react/comparison)

---

## Conclusion

TanStack Start is an exciting middle ground between Next.js and Vite+tRPC:

### It Solves:
- ✅ Slow Next.js build times (Vite speed)
- ✅ Type safety issues (TanStack Router)
- ✅ SEO concerns (built-in SSR)

### It Doesn't Solve:
- ❌ Maturity concerns (it's v1)
- ❌ Ecosystem size (small community)
- ❌ Risk (unproven in production)

### Bottom Line:

**TanStack Start is promising but risky right now. For your regex app, I'd recommend waiting 6 months for it to mature, then re-evaluate. In the meantime, Next.js is perfectly fine.**

But if you're an early adopter who values DX over stability, TanStack Start could be a great choice with 2-3 weeks of work.

---

**Want me to create a detailed TanStack Start migration TODO?** Just ask!

**Document Owner**: Development Team  
**Last Updated**: January 2, 2026  
**Next Review**: June 2026 (check TanStack Start maturity)
