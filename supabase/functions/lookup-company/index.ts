import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Firecrawl scrape helper ─────────────────────────────────────
async function firecrawlScrape(url: string, apiKey: string): Promise<string | null> {
  try {
    console.log("Firecrawl scraping:", url);
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Firecrawl error [${response.status}]:`, errText);
      return null;
    }

    const data = await response.json();
    const markdown = data?.data?.markdown || data?.markdown || null;
    console.log("Firecrawl scraped", markdown ? markdown.length : 0, "chars");
    return markdown;
  } catch (err) {
    console.error("Firecrawl scrape failed:", err);
    return null;
  }
}

// ─── Parse scraped content with AI ───────────────────────────────
async function parseWithAI(scrapedContent: string, companyName: string, lovableApiKey: string) {
  const prompt = `You are a strict data extraction tool. You MUST extract ONLY information for the company named "${companyName}".

CRITICAL RULES:
- The document may mention MULTIPLE companies (e.g. in search results, recommendations, ads). You MUST identify and extract data ONLY for "${companyName}".
- If "${companyName}" appears in the document, extract ONLY the data that belongs to that specific company listing — NOT data from other companies on the page.
- If "${companyName}" is NOT found in the document at all, set "found" to false and return empty strings for all fields.
- Do NOT guess, infer, fabricate, or make up ANY information. Only extract what is explicitly written in the text.
- Return the company's official registered name exactly as shown in the document (with correct capitalization) in the "registered_name" field.
- City names MUST be in UPPERCASE.
- Phone numbers: strip any leading zero after the country code.
- For the address: extract ONLY the "Besöksadress" (visiting address) that belongs to "${companyName}", not addresses of other companies.
- Set confidence to "high" ONLY for data directly found in the text next to/about "${companyName}".
- Set confidence to "none" for any field where you return an empty string.
- Extract ALL available business data: board members, CEO (VD), bankgiro, plusgiro, SNI codes, revenue, number of employees, F-skatt status, VAT registration.

Company we are looking for: "${companyName}"

TEXT TO EXTRACT FROM:
---
${scrapedContent}
---

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "found": true/false,
  "registered_name": "official company name with correct capitalization, or empty string",
  "org_number": "organization number as shown in text (e.g. 556830-5360) or empty string",
  "country": "Sweden",
  "address": "street address from Besöksadress section or empty string",
  "postcode": "postal code or empty string",
  "city": "CITY IN UPPERCASE or empty string",
  "phone": "phone number without leading zero, without dial code, or empty string",
  "dial_code": "+46",
  "email": "email or empty string",
  "website": "website URL or empty string",
  "company_type": "e.g. Aktiebolag, or empty string",
  "bankgiro": "bankgiro number or empty string",
  "plusgiro": "plusgiro number or empty string",
  "ceo_name": "VD / CEO name or empty string",
  "board_members": ["array of board member names or empty array"],
  "sni_codes": ["array of SNI codes with descriptions, e.g. '62100 Dataprogrammering'"],
  "revenue_sek": "latest revenue in SEK or empty string",
  "num_employees": "number of employees or empty string",
  "f_skatt": "Ja/Nej or empty string",
  "vat_registered": "Ja/Nej or empty string",
  "vat_number": "VAT/moms number or empty string",
  "registration_date": "company registration date or empty string",
  "confidence": {
    "overall": "high/medium/low/none",
    "org_number": "high/none",
    "address": "high/none",
    "postcode": "high/none",
    "city": "high/none",
    "phone": "high/none",
    "email": "high/none",
    "website": "high/none",
    "bankgiro": "high/none",
    "ceo_name": "high/none"
  },
  "warnings": [],
  "message": "brief summary"
}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI gateway error [${response.status}]: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response");
  return JSON.parse(jsonMatch[0]);
}

// ─── AI fallback for non-Swedish companies ───────────────────────
async function aiFallbackLookup(companyName: string, orgNumber: string, lovableApiKey: string) {
  const prompt = `You are a business registry lookup assistant. Given the company information below, provide what you know.

Company name: "${companyName}"
${orgNumber ? `Organization number: "${orgNumber}"` : ""}

IMPORTANT: Be honest about your confidence. Mark all fields as source "AI knowledge base" since this is from training data, not a verified registry. If you are not confident about a field, return an empty string instead of guessing.

City names MUST be in UPPERCASE.
Phone numbers: after the country dial code, strip any leading zero.

Respond ONLY with valid JSON (no markdown):
{
  "found": true/false,
  "org_number": "${orgNumber || ""}",
  "country": "country or empty string",
  "address": "address or empty string",
  "postcode": "postcode or empty string",
  "city": "CITY IN UPPERCASE or empty string",
  "phone": "phone without leading zero, without dial code, or empty string",
  "dial_code": "dial code or empty string",
  "email": "email or empty string",
  "website": "website or empty string",
  "company_type": "type or empty string",
  "confidence": {
    "overall": "low",
    "org_number": "low",
    "address": "low",
    "postcode": "low",
    "city": "low",
    "phone": "low",
    "email": "low",
    "website": "low"
  },
  "warnings": ["Data from AI knowledge base — not verified against official registry. Please verify all fields."],
  "message": "Data from AI training data — not verified"
}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI gateway error [${response.status}]: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response");
  
  const result = JSON.parse(jsonMatch[0]);
  result.sources = {
    org_number: "AI knowledge base (unverified)",
    address: "AI knowledge base (unverified)",
    postcode: "AI knowledge base (unverified)",
    city: "AI knowledge base (unverified)",
    phone: "AI knowledge base (unverified)",
    email: "AI knowledge base (unverified)",
    website: "AI knowledge base (unverified)",
  };
  result.verified = false;
  return result;
}

// ─── Main handler ────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Auth check: require authenticated HR user ---
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: roleCheck } = await authClient.rpc("is_hr_user");
  if (!roleCheck) {
    return new Response(JSON.stringify({ error: "Forbidden: HR role required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

  try {
    const { company_name, org_number } = await req.json();

    if (!company_name) {
      return new Response(JSON.stringify({ found: false, message: "Company name is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Strategy 1: Scrape hitta.se ───
    if (FIRECRAWL_API_KEY) {
      let scrapedMarkdown: string | null = null;
      const searchUrl = `https://www.hitta.se/sök?vad=${encodeURIComponent(company_name)}`;
      scrapedMarkdown = await firecrawlScrape(searchUrl, FIRECRAWL_API_KEY);

      if (scrapedMarkdown && scrapedMarkdown.length > 100) {
        const orgMatch = scrapedMarkdown.match(/företagsinformation\/[^/]+\/(\d{10})/);
        if (orgMatch) {
          const detailUrl = `https://www.hitta.se/företagsinformation/${orgMatch[0].split('/')[1]}/${orgMatch[1]}`;
          const detailMarkdown = await firecrawlScrape(detailUrl, FIRECRAWL_API_KEY);
          if (detailMarkdown && detailMarkdown.length > 100) {
            scrapedMarkdown = scrapedMarkdown + "\n\n--- DETAILED COMPANY PAGE ---\n\n" + detailMarkdown;
          }
        }
      }

      if ((!scrapedMarkdown || scrapedMarkdown.length < 100) && org_number) {
        const cleanOrg = org_number.replace(/\D/g, "");
        if (cleanOrg.length >= 6) {
          const nameSlug = company_name.toLowerCase().replace(/[^a-zåäö0-9]+/g, "+");
          const directUrl = `https://www.hitta.se/företagsinformation/${nameSlug}/${cleanOrg}`;
          scrapedMarkdown = await firecrawlScrape(directUrl, FIRECRAWL_API_KEY);
        }
      }

      if (scrapedMarkdown && scrapedMarkdown.length > 100) {
        try {
          const result = await parseWithAI(scrapedMarkdown, company_name, LOVABLE_API_KEY);
          if (result.city) result.city = result.city.toUpperCase();
          if (result.phone) result.phone = result.phone.replace(/^0+/, "");
          const source = "hitta.se (Bolagsverket / Skatteverket registry data)";
          result.sources = {};
          result.verified = true;
          const allFields = ["org_number", "address", "postcode", "city", "phone", "email", "website", "bankgiro", "ceo_name", "company_type"];
          for (const field of allFields) {
            result.sources[field] = result[field] ? source : "Not found in registry";
          }
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (parseError) {
          console.error("AI parsing of scraped content failed:", parseError);
        }
      } else {
        console.log("No usable content scraped from hitta.se, falling back to AI");
      }
    } else {
      console.log("FIRECRAWL_API_KEY not set, using AI fallback");
    }

    // ─── Strategy 2: AI fallback ───
    const result = await aiFallbackLookup(company_name, org_number || "", LOVABLE_API_KEY);
    if (result.city) result.city = result.city.toUpperCase();
    if (result.phone) result.phone = result.phone.replace(/^0+/, "");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Company lookup error:", error);

    if (error instanceof Error && error.message.includes("429")) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (error instanceof Error && error.message.includes("402")) {
      return new Response(JSON.stringify({ error: "Payment required." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage, found: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
