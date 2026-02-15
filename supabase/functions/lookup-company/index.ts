import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { company_name, org_number } = await req.json();

    if (!company_name || !org_number) {
      return new Response(JSON.stringify({ found: false, message: "Both company name and organization number are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a business registry lookup expert. Given the following company information, provide all known details about this company.

Company name: "${company_name}"
Organization number: "${org_number}"

Instructions:
1. First, determine which country this organization number belongs to based on its format:
   - Swedish org numbers: 10 digits (NNNNNN-NNNN), companies often start with 556xxx
   - Norwegian org numbers: 9 digits
   - Finnish: 7 digits + check digit (NNNNNNN-C)
   - Danish CVR: 8 digits
   - For other formats, try to identify the country

2. Based on the company name, org number, and identified country, provide all the details you know or can reasonably infer about this company:
   - Registered address (street, postcode, city)
   - Country
   - Phone number (with international dial code)
   - Email address
   - Website URL

3. Rate your confidence for each field: "high" (very likely correct), "medium" (reasonable guess), "low" (uncertain), or "none" (no data).

4. If the org number format is invalid for any known country, or if the company name doesn't match what you'd expect for that org number, flag that.

Respond ONLY with valid JSON (no markdown):
{
  "found": true/false,
  "country": "country name or empty string",
  "address": "street address or empty string",
  "postcode": "postal code or empty string",
  "city": "city name or empty string",
  "phone": "phone number without dial code or empty string",
  "dial_code": "international dial code like +46 or empty string",
  "email": "email address or empty string",
  "website": "website URL or empty string",
  "company_type": "e.g. Aktiebolag (AB), Sole Proprietor, etc. or empty string",
  "confidence": {
    "overall": "high/medium/low/none",
    "address": "high/medium/low/none",
    "phone": "high/medium/low/none",
    "email": "high/medium/low/none",
    "website": "high/medium/low/none"
  },
  "warnings": ["array of warning strings if any issues found, e.g. 'Org number format invalid', 'Company name mismatch'"],
  "message": "brief summary of what was found"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      throw new Error(`AI gateway error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Company lookup error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage, found: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
