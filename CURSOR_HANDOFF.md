# AirROI Cursor Handoff — Phase 4 Ready
**Date**: Feb 11, 2026 | **Branch**: master | **Ahead**: 18 commits | **Working tree**: Clean

---

## SYSTEM SUMMARY

**What**: Real estate STR/MTR/LTR underwriting app.
**Stack**: React 19 + Vite + Tailwind v4 + Claude API + RentCast API + Express proxy.

**Architecture**:
```
Browser (Vite :3000) → /api proxy → Express (:3002) → Claude / RentCast APIs
```
- API keys are server-side ONLY (no VITE_ prefix).
- Server: helmet, CORS restricted, rate limiting (IP-based), TTL caching, auth scaffold.
- Frontend: React Query client cache (30m stale, 24h gc, refetchOnMount: false).
- Production: `npm run build` → Express serves `dist/` + SPA fallback.

**How to run**:
```bash
npm run dev:full   # concurrently: Express :3002 + Vite :3000 (proxy /api → :3002)
```

---

## FILE MAP

### Server

| File | Lines | Purpose |
|------|-------|---------|
| `server/index.ts` | ~310 | Express server. helmet, CORS, rate limiting, Claude proxy, RentCast proxy, auth session, health check, static file serving + SPA fallback. Rate limits: 30/min general, 10/min Claude, 3/10min analysis. |
| `server/cache.ts` | 78 | TTL in-memory cache. `claudeCache` (30m), `rentcastCache` (60m). maxSize: 500, LRU eviction. |
| `server/auth.ts` | 103 | Session-based auth scaffold. IP fallback. Tier limits defined (free: 3/day, pro: 50/day) but NOT enforced yet. Replace with Supabase/NextAuth for production auth. |

### Frontend — Core

| File | Lines | Purpose |
|------|-------|---------|
| `App.tsx` | 885 | State hub. 30+ useState vars, React Query hooks, computed values (capRate, CoC, DSCR), handlers for analysis/save/amenities/advanced. Thin JSX routing to tab components. |
| `services/claudeService.ts` | 746 | All Claude calls via `claudeProxy()` → `fetch('/api/claude/...')`. `withRetry` (90s countdown on 429). `parseJSON`. `analyzeProperty` (main), web search, sensitivity, amenity ROI, path to yes, lender packet, market discovery, comp scoring. All console.log gated behind `import.meta.env.DEV`. |
| `services/rentcastService.ts` | 193 | RentCast via `fetch('/api/rentcast/...')`. `fetchPropertyData` (parallelized: listing + AVM + property via Promise.all), `fetchMarketStats`, `fetchRentEstimate`. STR functions are stubs (Claude handles STR). |
| `src/hooks/usePropertyData.ts` | 130 | React Query hooks: `usePropertyData`, `useMarketStats`, `useRentEstimate`, `useSTRData`, `useWebSTRData`, `usePropertyAnalysis`, `useRentCastData` (composite). All: staleTime 30m, refetchOnMount false. |
| `src/lib/queryClient.tsx` | 62 | Global: gcTime 24h, staleTime 5m, retry 3 exponential, refetchOnMount false. |

### Frontend — Components

| File | Purpose |
|------|---------|
| `components/NavBar.tsx` | Horizontal top nav (fixed), strategy toggle (STR/MTR/LTR) |
| `components/SearchBar.tsx` | Address input, "Web Search Data" badge (only when active), UNDERWRITE button |
| `components/DashboardTab.tsx` | Hero card, metrics, amenities, AI analysis, advanced analysis, comps, sources |
| `components/SettingsTab.tsx` | Global settings, investment targets, amenity editor |
| `components/PortfolioTab.tsx` | Saved assessments grid, comparison selection |
| `components/ComparisonModal.tsx` | Side-by-side property comparison overlay |
| `components/Charts.tsx` | Performance charts (recharts) |
| `components/FinancialTables.tsx` | Monthly/yearly cash flow tables. Resizable columns with proper unmount cleanup. |
| `components/PathToYesPanel.tsx` | Path to Yes analysis panel |
| `components/SensitivityTable.tsx` | Sensitivity analysis matrix |
| `components/AmenityROIPanel.tsx` | Amenity ROI analysis panel |
| `components/LenderPacketExport.tsx` | Lender packet generator |
| `components/PropertyChat.tsx` | AI chat about the property |
| `components/ui/ErrorBoundary.tsx` | Error boundaries |
| `components/ui/ProgressIndicator.tsx` | Step-by-step analysis progress ("Activating deep analytical models") |
| `components/ui/Toast.tsx` + `ToastContext.tsx` | Toast notification system |

### Utils / Config

| File | Purpose |
|------|---------|
| `utils/financialLogic.ts` | `calculateMonthlyProjections`, `aggregateToYearly` |
| `utils/formatCurrency.ts` | USD formatter |
| `utils/exportReport.ts` | HTML report generation + print |
| `prompts/underwriting.ts` | All Claude prompt templates |
| `types.ts` | `PropertyConfig`, `MarketInsight`, `SavedAssessment`, `Amenity`, `RentalStrategy` |
| `constants.ts` | `DEFAULT_CONFIG`, `AMENITIES` |
| `vite.config.ts` | Proxy `/api` → `:3002`. HMR ws on localhost:3000. |
| `.env` | `ANTHROPIC_API_KEY`, `RENTCAST_API_KEY` (server-side only). Optional `CORS_ORIGIN`. |

---

## CRITICAL SNIPPETS — PRESERVE EXACTLY

### Address Normalization (App.tsx ~L398)
```typescript
const normalizeAddress = (address: string): string => {
  return address.trim().toLowerCase().replace(/\s+/g, ' ').replace(/,\s*/g, ', ');
};
```

### Main Element Padding (App.tsx ~L686) — MUST KEEP pt-24
```typescript
<main className="flex-1 pt-24 px-4 pb-4 lg:px-8 lg:pb-8 print:pt-0 print:p-0">
```
**Why**: `pt-24` spaces content below fixed nav. `p-8` would override to `pt-8`.

### Claude Proxy (claudeService.ts ~L122)
```typescript
async function claudeProxy(params: {
  model: string; max_tokens: number;
  messages: { role: string; content: string }[];
  tools?: any[]; system?: string;
}, endpoint: string = '/api/claude/messages'): Promise<{ type: string; text: string }[]>
```
All Claude calls flow through this. Analysis uses `/api/claude/analysis` (stricter rate limit).

### Server Key Loading (server/index.ts ~L28)
```typescript
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;
```
NO `VITE_*` fallbacks. Keys must not have `VITE_` prefix or Vite bundles them into the browser.

### Web Search Gate (App.tsx ~L176-195)
```typescript
const webSTRQuery = useWebSTRData(targetAddress, propertyQuery.data?.bedrooms,
  propertyQuery.data?.bathrooms, !!targetAddress && propertyQuery.isSuccess);

const strData = useMemo(() => {
  if (webSTRQuery.data) return { rent: webSTRQuery.data.adr, occupancy: webSTRQuery.data.occupancy / 100, source: 'web_search' };
  return null;
}, [webSTRQuery.data]);

useEffect(() => { setIsUsingWebData(!!webSTRQuery.data); }, [webSTRQuery.data]);
```

---

## KNOWN ISSUES & EDGE CASES

| Issue | Status | Notes |
|-------|--------|-------|
| WebSocket errors in console | Cosmetic | Vite HMR noise when port 3000 in use |
| First search ~90-120s | Expected | RentCast + web search + 5s delay + analysis |
| Repeat search <1s | Expected | React Query + server cache |
| STR web search returns prose | Improved | Better regex; Claude sometimes ignores JSON-only instruction |
| Auth tier limits not enforced | Known | Scaffold only — replace with Supabase for real auth |
| Server cache in-memory | Limitation | Clears on restart. Use Redis for multi-server prod. |
| Many `any` types | Tech debt | ~20+ `any` casts in services and components |
| No CI/CD, no monitoring | Missing | No GitHub Actions, Sentry, or APM |
| 5s sleep before analysis | Intentional | Prevents 429 on first search; skipped on cache hits |

---

## COMPLETED PHASES

1. **Core MVP**: STR/MTR/LTR underwriting, 20-year projections, AI recommendations
2. **Tailwind v4**: PostCSS migration complete
3. **React Query**: Client-side caching (30m stale, 24h gc)
4. **Error Handling**: Error boundaries, toast system, progress indicator
5. **UI Polish**: Horizontal nav, dashboard reorder, spacing optimization
6. **App.tsx Decomposition**: 1774 → 885 lines, 10+ extracted components
7. **Backend Proxy**: Express API server, keys server-side, rate limiting, TTL cache
8. **Pre-Production Hardening**: helmet, CORS, API key leak fixes, dead code removal, error sanitization, parallelized RentCast calls, event listener cleanup

---

## EXACT NEXT TASK

### Option A: Deploy to Production
1. `npm run build` — builds frontend to `dist/`
2. Server already serves `dist/` via `express.static` + SPA fallback
3. Deploy Express server to Railway/Render/Fly.io
4. Set env vars: `ANTHROPIC_API_KEY`, `RENTCAST_API_KEY`, `CORS_ORIGIN`, `NODE_ENV=production`
5. Add `"start": "node --loader tsx server/index.ts"` script to package.json

### Option B: Real Auth (Supabase)
1. Replace `server/auth.ts` scaffold with Supabase Auth
2. Add login/signup UI
3. Per-user rate limits with Supabase session tokens
4. PostgreSQL for persisting saved assessments
5. Stripe integration for paid tiers

### Option C: Performance & DX
1. Add `manualChunks` to vite.config.ts (vendor, react-query, recharts)
2. Lazy-load Charts and FinancialTables tabs
3. Wrap heavy components in `React.memo`
4. Use `useCallback` for handlers passed to child components
5. Reduce/remove 5s sleep in `claudeService.ts` if rate limiting is stable

---

## IMPORTANT RULES

1. **Never remove `pt-24` from main** — preserves nav spacing
2. **Keep `normalizeAddress` identical** — changes break cache keys
3. **Keep `refetchOnMount: false`** — global default prevents cache miss
4. **API keys must stay server-side** — never use `VITE_` prefix for secrets
5. **Server must run before frontend** — Vite proxies `/api` → `:3002`
6. **Express 5 in use** — no `*` wildcard routes, use `app.use()` for catch-all
7. **Side effects in `useEffect`, never `useMemo`** — recently fixed, don't regress

---

## PERFORMANCE BASELINE

| Metric | Value |
|--------|-------|
| First search | 90-120s (RentCast + web search + delays + analysis) |
| Repeat search | <1s (client cache) or <100ms (server cache hit) |
| Client cache | 24h gcTime, 30m staleTime |
| Server cache | 30m Claude, 60m RentCast, maxSize 500 |
| Rate limits | 30/min general, 10/min Claude, 3/10min analysis (per IP) |
