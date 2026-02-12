# API Usage Dashboard Links & Integration Guide

## Quick Access Dashboard URLs

### Claude API (Anthropic)
- **Main Dashboard**: https://console.anthropic.com/dashboard
- **Billing & Usage**: https://console.anthropic.com/settings/billing
- **Cost Reports**: Available in console under Usage section

### RentCast API
- **API Dashboard**: https://app.rentcast.io/app/api
- **Usage & Metrics**: Shows API requests, billing period, and current plan
- **Billing Info**: Displays in dashboard after login

## Current Implementation

Your Admin tab now has **Quick Access Links** at the top of the Cost Tracking section:
- **Claude Dashboard** → Opens Anthropic console
- **Claude Billing** → Direct to billing page
- **RentCast Dashboard** → Opens RentCast API portal

All links open in new tabs for easy access.

## Optional: Programmatic API Integration

Both platforms offer APIs to pull usage data programmatically:

### 1. Claude Cost Report API

**Endpoint**: `GET https://api.anthropic.com/v1/organizations/cost_report`

**Requirements**:
- Admin API Key (different from regular API key)
- Developer, Billing, or Admin role
- Beta header: `anthropic-beta: admin-api-2024-12-19`

**Example Request**:
```bash
curl https://api.anthropic.com/v1/organizations/cost_report \
  -H "anthropic-version: 2023-06-01" \
  -H "X-Api-Key: $ANTHROPIC_ADMIN_API_KEY" \
  -H "anthropic-beta: admin-api-2024-12-19" \
  -G \
  --data-urlencode "starting_at=2026-02-01T00:00:00Z" \
  --data-urlencode "bucket_width=1d"
```

**Response**:
```json
{
  "data": [{
    "starting_at": "2026-02-01T00:00:00Z",
    "ending_at": "2026-02-02T00:00:00Z",
    "results": [{
      "amount": "123.45",
      "currency": "USD",
      "model": "claude-sonnet-4",
      "token_type": "uncached_input_tokens",
      "description": "Claude Sonnet 4 Usage - Input Tokens"
    }]
  }],
  "has_more": false
}
```

### 2. RentCast Usage Data

RentCast shows usage directly in their dashboard at https://app.rentcast.io/app/api

**What you can see**:
- API requests used this billing period (e.g., 348 of 1,000)
- Days remaining in billing period (e.g., 19 of 28 days)
- Current plan details
- Request history and metrics

**Note**: RentCast doesn't appear to have a public API for retrieving usage data programmatically. You'll need to check the dashboard manually or contact their support for API access.

## Integration Steps (Optional)

If you want to pull live data into your admin dashboard:

### Step 1: Get Admin API Key (Claude)

1. Go to https://console.anthropic.com/settings/keys
2. Create a new Admin API key (not a regular API key)
3. Store it in your `.env` file:
   ```
   ANTHROPIC_ADMIN_API_KEY=sk-ant-admin-...
   ```

### Step 2: Add Backend Endpoint

Create a new endpoint in `server/index.ts`:

```typescript
app.get('/api/admin/claude-live-costs', async (req, res) => {
  try {
    const adminKey = process.env.ANTHROPIC_ADMIN_API_KEY;
    if (!adminKey) {
      return res.status(503).json({ error: 'Admin API key not configured' });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const response = await fetch(
      `https://api.anthropic.com/v1/organizations/cost_report?` +
      `starting_at=${yesterday.toISOString()}&bucket_width=1d`,
      {
        headers: {
          'anthropic-version': '2023-06-01',
          'X-Api-Key': adminKey,
          'anthropic-beta': 'admin-api-2024-12-19',
        }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Failed to fetch Claude costs:', error);
    res.status(500).json({ error: 'Failed to fetch Claude costs' });
  }
});
```

### Step 3: Display in Admin UI

Add a "Sync Live Data" button that fetches and displays actual costs from Anthropic's API.

## Recommendation

**For now**: Use the dashboard links provided. They're faster and more reliable than building an integration.

**Benefits of dashboard links**:
- ✅ Always up-to-date
- ✅ Official data directly from source
- ✅ No additional API keys needed
- ✅ Access to all features (charts, exports, historical data)
- ✅ One-click access from Admin tab

**When to build integration**:
- When you need automated alerts based on actual costs
- For custom reporting across multiple APIs
- If you want to consolidate all costs in one view
- After validating the app with real users

## Cost Tracking: Current vs. Live Data

**Current Implementation** (What you have now):
- Tracks API calls made through your server
- Estimates costs based on token usage
- Real-time for your application
- Shows what your app is spending
- **Advantage**: Instant feedback, no external dependencies

**Live API Data** (Optional integration):
- Actual billed costs from Anthropic/RentCast
- May have slight delays (hours to 1 day)
- Authoritative source for billing
- **Advantage**: 100% accurate for invoicing

## Best Approach

Use **both**:
1. **Your internal tracking**: Monitor real-time costs, debug issues, optimize
2. **Dashboard links**: Weekly check for actual bills, verify accuracy
3. **Compare monthly**: Ensure your estimates match actual costs (should be within 5%)

If estimates differ significantly, adjust your pricing constants in `server/costTracker.ts`.

## Quick Setup (What I Just Did)

✅ Added 3 dashboard buttons to Admin Cost Tracking section:
- Claude Dashboard
- Claude Billing  
- RentCast Dashboard

All open in new tabs, positioned at the top of the cost section for easy access.

**To use**: 
1. Go to Admin tab
2. Scroll to "API Cost Tracking" section
3. Click the dashboard buttons
4. Log in if needed
5. View your actual usage and costs

That's it! You now have one-click access to both dashboards from your admin panel.
