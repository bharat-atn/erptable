import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const { country, postcode, city, address, phone, dialCode, org_number } = await req.json();

    if (!country) {
      return new Response(JSON.stringify({ valid: true, message: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are an expert in international business registration, address formats, and telecom standards. Validate ALL of the following fields for the country "${country}".

${org_number ? `Organization number: "${org_number}"` : "Organization number: (not provided)"}
${postcode ? `Postcode: "${postcode}"` : "Postcode: (not provided)"}
${city ? `City: "${city}"` : "City: (not provided)"}
${address ? `Street address: "${address}"` : "Street address: (not provided)"}
${phone ? `Phone number: "${dialCode || ""}${phone}" (dial code: ${dialCode || "unknown"})` : "Phone: (not provided)"}

Rules:
1. ORGANIZATION NUMBER: If provided, validate against the EXACT rules for "${country}":
   - Sweden: 10 digits (NNNNNN-NNNN), digit 3 must be ≥2 for companies. Check Luhn algorithm on all 10 digits. AB (Aktiebolag) orgs start with 5564-5599 in first 4 digits typically. Sole proprietors use personal numbers (start with birth date). Accept with or without hyphen.
   - Norway: 9 digits, check MOD 11. 
   - Finland: 7 digits + check digit (FI format: NNNNNNN-C).
   - Denmark: 8 digits (CVR number).
   - For other countries, validate against known business registration formats.
   Explain what type of entity the number suggests (e.g. "Valid Swedish AB (limited company)" or "This looks like a sole proprietor personal number").

2. POSTCODE: Check format matches ${country}'s postal system.
3. CITY: Check if it's a real city/town/municipality in ${country}.
4. POSTCODE+CITY: If both provided, check if they match geographically.
5. ADDRESS: Check if it follows local street naming conventions.
6. PHONE: Check dial code matches country, length is correct, format is valid.

Respond ONLY with valid JSON (no markdown):
{
  "org_number_valid": true/false/null,
  "org_number_message": "detailed explanation (entity type, format issues) or empty string",
  "postcode_valid": true/false/null,
  "postcode_message": "brief explanation or empty string",
  "city_valid": true/false/null, 
  "city_message": "brief explanation or empty string",
  "match_valid": true/false/null,
  "match_message": "brief explanation if postcode and city don't match, or empty string",
  "address_valid": true/false/null,
  "address_message": "brief explanation or empty string",
  "phone_valid": true/false/null,
  "phone_message": "brief explanation or empty string"
}

Use null if the field was not provided. Be concise but specific about org number validation.`;

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
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI gateway error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON from the AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Address validation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
