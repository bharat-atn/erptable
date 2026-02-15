

# Rebuild Company Lookup with Real Data Sources

## Problem

The current company lookup uses an AI model (Gemini) to **guess** company information from its training data. This produces fabricated addresses, postcodes, phone numbers, and organization numbers -- none verified against actual business registries. This is unacceptable for a professional HR system.

## Solution

Replace the "AI guessing" approach with a **real data scraping** strategy:

1. **Scrape real business directories** (e.g. allabolag.se for Swedish companies) using the Firecrawl connector to get verified registry data
2. **Use AI only to parse and structure** the scraped content -- never to invent data
3. **Show clear source attribution** and confidence for every field
4. **Flag fields with no verified source** so users know what to double-check

## Architecture

The new `lookup-company` edge function will follow this flow:

```text
User enters company name
        |
        v
Edge Function receives name + optional org number
        |
        v
Step 1: Scrape allabolag.se search results via Firecrawl
        |
        v
Step 2: Scrape the company detail page for full info
        |
        v
Step 3: Use AI (Gemini) ONLY to parse the scraped
        markdown into structured JSON fields
        |
        v
Step 4: Return structured data with source = 
        "allabolag.se (Bolagsverket registry data)"
```

## Implementation Steps

### Step 1 -- Connect Firecrawl

Enable the Firecrawl connector so the edge function can scrape business directory websites. Firecrawl handles JavaScript rendering, anti-bot measures, and returns clean markdown.

### Step 2 -- Rewrite `lookup-company` Edge Function

**File:** `supabase/functions/lookup-company/index.ts`

The new logic:

1. **Search phase**: Use Firecrawl to scrape `https://www.allabolag.se/sok?q={company_name}` (URL-encoded). This returns a search results page with matching companies.

2. **Detail phase**: Parse the search results to find the best match. Then scrape the individual company page (e.g. `https://www.allabolag.se/5590360795`) to get full details including:
   - Organization number
   - Registered address (street, postcode, city)
   - Phone number
   - Website
   - Company type (AB, HB, etc.)

3. **Parse phase**: Use AI (Gemini) to extract structured JSON from the scraped markdown. The AI prompt will be strictly limited to parsing -- it must ONLY extract data present in the scraped text, never invent anything.

4. **Source attribution**: Every field will carry `source: "allabolag.se (Swedish Companies Registration Office)"` since allabolag.se sources its data from Bolagsverket.

5. **Fallback for non-Swedish companies**: If the company doesn't appear to be Swedish (based on name or org number format), fall back to the current AI-based approach but clearly mark all fields as `source: "AI knowledge base"` with `confidence: "low"`.

### Step 3 -- Update Confidence Display in `CompanyFormDialog.tsx`

**File:** `src/components/dashboard/CompanyFormDialog.tsx`

- Show confidence badges: **Verified** (green, from real registry), **Unverified** (yellow, AI-inferred), **Not found** (gray)
- For fields from real registry sources, show a checkmark with "Verified from [source]"
- For fields the AI could not find in scraped data, show "Not found -- please fill manually" instead of fabricating data
- When a field has low confidence, do NOT auto-fill it -- leave it empty and show a note

### Step 4 -- Handle Edge Cases

- **Company not found on allabolag.se**: Return `found: false` with a clear message. Do not fabricate data.
- **Multiple matches**: Return the top match but include a warning that multiple companies matched
- **Firecrawl errors or rate limits**: Fall back gracefully with a message explaining the lookup service is temporarily unavailable
- **Organization number provided**: Use it to search directly on allabolag.se for exact match (e.g. `https://www.allabolag.se/{org_number_no_hyphens}`)

## Technical Details

### Edge Function Changes

The rewritten `lookup-company/index.ts` will:

1. Check for `FIRECRAWL_API_KEY` environment variable
2. Construct search URL: `https://www.allabolag.se/sok?q=${encodeURIComponent(company_name)}`
3. If org number is provided, also try direct URL: `https://www.allabolag.se/${orgNumber.replace(/\D/g, '')}`
4. Call Firecrawl scrape API with `formats: ['markdown']` and `onlyMainContent: true`
5. Send scraped markdown to Gemini with a **parsing-only prompt** that says: "Extract ONLY the data present in this text. If a field is not found in the text, return empty string. Do NOT guess or infer."
6. Post-process: uppercase city, strip leading zero from phone
7. Return with proper source attribution for each field

### New AI Prompt (Parsing Only)

The key difference is the prompt will include the actual scraped content and instruct the AI:

- "You are a data extraction tool. Extract ONLY information explicitly present in the following text."
- "If a piece of information is not found in the text, return an empty string for that field."
- "Do NOT guess, infer, or make up any information."
- "Set confidence to 'high' only for data directly found in the text."

### Frontend Changes

- Update `FieldMessage` to show "Verified" vs "Unverified" badges
- Only auto-fill fields that have `confidence: "high"` from verified sources
- Fields with no data should remain empty rather than being filled with guesses
- Show a clear banner when data comes from a verified registry vs AI inference

## What This Achieves

- **Real data**: Company details come from actual business registries, not AI hallucinations
- **Transparency**: Every field shows exactly where the data came from
- **Trust**: Users can see verified vs unverified labels
- **Honesty**: Fields without verified data are left empty instead of fabricated
- **Swedish standard**: allabolag.se already provides data in Swedish format (uppercase cities, proper postcodes)
