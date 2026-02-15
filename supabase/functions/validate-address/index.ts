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
    const { country, postcode, city, address, phone, dialCode } = await req.json();

    if (!country) {
      return new Response(JSON.stringify({ valid: true, message: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are an address and contact validation expert. Validate the following fields for the country "${country}".

${postcode ? `Postcode: "${postcode}"` : "Postcode: (not provided)"}
${city ? `City: "${city}"` : "City: (not provided)"}
${address ? `Street address: "${address}"` : "Street address: (not provided)"}
${phone ? `Phone number: "${dialCode || ""}${phone}" (dial code: ${dialCode || "unknown"})` : "Phone: (not provided)"}

Rules:
1. If a postcode is provided, check if it matches the postal code format for ${country}. 
2. If a city is provided, check if it's a real city/town/municipality in ${country}.
3. If both postcode and city are provided, check if the postcode could correspond to that city area.
4. If a street address is provided, check if it looks like a plausible street address for ${country} (correct format, naming conventions like "vägen", "gatan" for Sweden, "Street", "Road" for English-speaking countries, etc.). Minor issues are OK.
5. If a phone number is provided with dial code, check if:
   - The dial code matches the selected country
   - The phone number has the correct length for that country
   - The format looks valid (e.g. Swedish mobile numbers start with 7 and are 9 digits after country code)

Respond ONLY with valid JSON (no markdown):
{
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

Use null if the field was not provided. Be concise. Only flag clear errors, not minor formatting differences.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 300,
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
