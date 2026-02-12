# Settings UX & Amenity Pricing Improvements

## Overview

This plan addresses three interconnected UX improvements:
1. **HELOC defaults** — Change to 0% (users enable when needed)
2. **Auto-populated field visibility** — Light blue background to distinguish from hardcoded settings
3. **Amenity cost estimation** — Claude estimates amenity costs based on property location, runs as background task so assessment displays immediately

---

## Change 1: HELOC Defaults to 0%

### File: `constants.ts`

Change the default `helocFundingPercent` and `helocPaydownPercent` from their current values to `0`:

**Current:**
```typescript
helocFundingPercent: 100,      // % of upfront funded by HELOC
helocPaydownPercent: 50,       // % of NOI paid toward HELOC
```

**New:**
```typescript
helocFundingPercent: 0,        // Default: no HELOC funding
helocPaydownPercent: 0,        // Default: no HELOC paydown
```

**Rationale**: Most users don't use HELOC financing. Defaulting to 0 reduces decision fatigue and makes the mortgage-only model the baseline.

**Impact**: 
- New analyses will default to 0% HELOC
- Existing saved assessments are unaffected
- Users still see HELOC sliders to enable when needed

---

## Change 2: Visual Distinction for Auto-Populated Fields

### Problem

When you run an assessment, these fields get auto-populated from AI/RentCast data:
- `suggestedADR` → ADR
- `suggestedOccupancy` → Occupancy
- `suggestedPropertyTax` → Property Tax
- `suggestedMTRRent` → MTR Monthly Rent
- `suggestedLTRRent` → LTR Monthly Rent
- `suggestedFurnishingsCost` → Furnishings Cost
- `suggestedHOA` → HOA Fee

These should look different from hardcoded defaults so users know they came from AI analysis, not fixed assumptions.

### Solution: Light Blue Background + Badge

**File: `DashboardTab.tsx`**

Add a helper function to detect if a value was auto-populated:

```typescript
// After the component declaration, add:
const isAutoPopulated = (fieldName: string, config: PropertyConfig, insight: MarketInsight | null): boolean => {
  if (!insight) return false;
  
  const autoPopulatedFields = {
    adr: insight.suggestedADR,
    occupancyPercent: insight.suggestedOccupancy,
    propertyTaxMonthly: insight.suggestedPropertyTax,
    mtrMonthlyRent: insight.suggestedMTRRent,
    ltrMonthlyRent: insight.suggestedLTRRent,
    furnishingsCost: insight.suggestedFurnishingsCost,
    hoaMonthly: insight.suggestedHOA,
  };
  
  return config[fieldName as keyof PropertyConfig] === autoPopulatedFields[fieldName as keyof typeof autoPopulatedFields];
};
```

For any input field that matches an auto-populated value, wrap it with a light blue background:

```typescript
// Example: ADR input field
<div className={`p-3 rounded ${
  isAutoPopulated('adr', config, insight) ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-white'
}`}>
  <label className="text-xs font-black text-slate-600">ADR</label>
  {isAutoPopulated('adr', config, insight) && (
    <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-2">AI-Suggested</span>
  )}
  <input
    type="number"
    value={config.adr}
    onChange={(e) => updateConfig('adr', parseFloat(e.target.value))}
  />
</div>
```

**Visual Result**:
- Hardcoded defaults: white background (neutral)
- AI-suggested values: light blue background + "AI-Suggested" badge
- User immediately sees which values came from analysis vs. which are assumptions

---

## Change 3: Per-User Settings Storage

### Problem

Currently, global settings are stored in a single localStorage key: `airroi_global_settings`.

With the per-user authentication phase coming, you'll need per-user settings. For now, we can:
- Keep a global default in localStorage
- Allow override per session (before auth is added)

### Solution: localStorage with namespace

**File: `App.tsx` or new `src/hooks/useSettings.ts`**

Create a custom hook for managing settings:

```typescript
export const useSettings = () => {
  // For now, use global key. Later, will use userId prefix
  const storageKey = 'airroi_global_settings';
  
  const getSettings = (): PropertyConfig => {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  };
  
  const saveSettings = (config: PropertyConfig) => {
    localStorage.setItem(storageKey, JSON.stringify(config));
  };
  
  return { getSettings, saveSettings };
};
```

**When auth is added (Phase 13)**, change the storageKey to:
```typescript
const storageKey = `airroi_settings_${userId}`; // Scoped to user
```

**No changes needed now** — the hook pattern future-proofs the code.

---

## Change 4: Claude Amenity Cost Estimation

### Problem

Currently, amenities are hardcoded at $5,000 each. This doesn't reflect regional differences:
- Hot tub in Miami: $8,500 (tropical climate, demand)
- Hot tub in rural Montana: $6,500 (less demand, colder climate)

### Solution: Claude estimates amenity costs based on property location

**File: `prompts/underwriting.ts`**

Add a new prompt template:

```typescript
export const AMENITY_PRICING_PROMPT = (address: string, propertyType: string, marketData: any): string => {
  return `You are a real estate development cost estimator.

Given a property location and market context, estimate reasonable installation costs for common short-term rental amenities.

Property: ${address}
Type: ${propertyType}
Market: ${marketData?.marketName || 'Unknown'}

Return ONLY valid JSON with no markdown:
{
  "pool": { "minCost": 15000, "maxCost": 25000, "reasoning": "..." },
  "hotTub": { "minCost": 6000, "maxCost": 10000, "reasoning": "..." },
  "sauna": { "minCost": 5000, "maxCost": 8000, "reasoning": "..." },
  "gameRoom": { "minCost": 3000, "maxCost": 6000, "reasoning": "..." },
  "luxuryDeck": { "minCost": 10000, "maxCost": 18000, "reasoning": "..." },
  "evCharger": { "minCost": 1000, "maxCost": 2000, "reasoning": "..." }
}

Base your estimates on:
1. Regional labor costs (adjust for local wage levels)
2. Material costs (vary by region)
3. Local demand/ROI expectations
4. Climate (tropical = more pools, snowy = less outdoor amenities)`;
};
```

**File: `services/claudeService.ts`**

Add a new export function:

```typescript
export const estimateAmenityCosts = async (address: string, propertyType: string, marketData: any) => {
  try {
    const content = await claudeProxy({
      model: getModel('simple_task'), // Fast + cheap (Haiku)
      max_tokens: 800,
      messages: [{ role: 'user', content: AMENITY_PRICING_PROMPT(address, propertyType, marketData) }]
    });
    const text = extractText(content);
    return parseJSON(text);
  } catch (e) {
    console.error('Amenity cost estimation failed:', e);
    return null; // Fallback to hardcoded values
  }
};
```

---

## Change 5: Background Task for Amenity Pricing

### Problem

Calling Claude to estimate amenity costs adds 5-10 seconds to the initial assessment. Users want to see the assessment immediately, then populate amenities later.

### Solution: Background task pattern

**File: `App.tsx`**

After the initial analysis completes, fire off an async amenity cost estimation:

```typescript
// In the useEffect where analysis completes:
useEffect(() => {
  if (insight && propertyData && !amenityCosts) {
    // Fire off background task (don't await it)
    estimateAmenityCosts(
      targetAddress,
      propertyData.propertyType || 'Unknown',
      marketStats
    ).then((costs) => {
      if (costs) {
        // Store in state or localStorage for later use
        setAmenityCosts(costs);
        // Optionally update SettingsTab to show the new values
      }
    }).catch(console.error);
  }
}, [insight, propertyData]);

// New state
const [amenityCosts, setAmenityCosts] = useState<any>(null);
```

**No loading indicator needed** — the assessment displays immediately while costs fetch in the background.

---

## Change 6: Update SettingsTab to Show Amenity Costs

### File: `SettingsTab.tsx`

When amenity cost estimates arrive, show them as "Suggested" in the amenity editor:

**Current amenity editor:**
```typescript
{selectedAmenities.map((amenity) => (
  <div key={amenity.id} className="bg-slate-50 p-3 rounded">
    <input placeholder="Cost" value={amenity.cost} onChange={...} />
  </div>
))}
```

**Updated with background cost suggestions:**
```typescript
{selectedAmenities.map((amenity) => {
  const suggestedCost = amenityCosts?.[amenity.id]?.minCost; // Or average of min/max
  const hasSuggestion = !!suggestedCost && suggestedCost !== amenity.cost;
  
  return (
    <div key={amenity.id} className={`p-3 rounded ${
      hasSuggestion ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-slate-50'
    }`}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold">{amenity.name}</label>
        {hasSuggestion && (
          <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            Suggested: ${suggestedCost.toLocaleString()}
          </span>
        )}
      </div>
      <input
        type="number"
        placeholder="Cost"
        value={amenity.cost}
        onChange={(e) => updateAmenity(amenity.id, parseFloat(e.target.value))}
      />
    </div>
  );
})}
```

---

## Implementation Order

1. **Change HELOC defaults** (5 min) — Quickest win
2. **Add visual distinction** (30 min) — Iterate on styling
3. **Implement amenity cost estimation** (20 min) — Add Claude call
4. **Background task** (15 min) — Fire and forget pattern
5. **Update SettingsTab** (15 min) — Show suggestions

**Total: ~1.5 hours**

---

## Testing Checklist

- [ ] HELOC defaults are 0% for new assessments
- [ ] Run an assessment, verify auto-populated fields have blue background + "AI-Suggested" badge
- [ ] Hard-coded defaults remain white (not blue)
- [ ] Assessment displays immediately (not waiting for amenity costs)
- [ ] After 5-10 seconds, SettingsTab shows amenity cost suggestions
- [ ] Amenity costs vary by location (test with different cities)
- [ ] Settings persist in localStorage after page refresh
- [ ] Amenity suggestions disappear if costs can't be estimated (graceful fallback)

---

## Notes

- **Fallback**: If Claude amenity estimation fails, use hardcoded $5,000 values
- **Caching**: Consider caching amenity costs per property to avoid repeated API calls
- **Future**: When auth is added, migrate localStorage keys to `airroi_settings_{userId}`
- **Performance**: Amenity estimation uses Haiku (fast + cheap) to minimize cost
