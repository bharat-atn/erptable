import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dialCode, localNumber, nationality, preferredLanguage, dateOfBirth } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a data-validation assistant. Validate these user profile fields and return a JSON object.

Fields to validate:
- Phone dial code: "${dialCode}"
- Phone local number: "${localNumber}"
- Nationality: "${nationality}"
- Preferred language code: "${preferredLanguage}"
- Date of birth: "${dateOfBirth}"

Rules:
1. PHONE: Check if the local number length and format are valid for the given dial code country. For example:
   - Sweden (+46): local numbers are 7-10 digits (commonly 9 digits like 70XXXXXXX)
   - Romania (+40): local numbers are 9 digits
   - Thailand (+66): local numbers are 8-9 digits
   - Ukraine (+380): local numbers are 9 digits
   - For other countries, use standard ITU phone number length rules.
   - Strip spaces/dashes before counting digits. If empty, mark as valid with message "No phone number provided".

2. NATIONALITY: Check if nationality is consistent with the preferred language and dial code. 
   - sv language should typically match Swedish nationality and +46
   - ro language should typically match Romanian nationality and +40
   - Flag inconsistencies as warnings, not errors.

3. DATE_OF_BIRTH: Check if the person would be between 16 and 80 years old today (${new Date().toISOString().split("T")[0]}).
   - If empty, mark as valid with message "No date of birth provided".

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "phone": { "valid": true/false, "message": "..." },
  "nationality": { "valid": true/false, "message": "..." },
  "dateOfBirth": { "valid": true/false, "message": "..." }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a strict JSON-only validator. Return only valid JSON, no markdown fences." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
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
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI validation unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const raw = aiResult.choices?.[0]?.message?.content ?? "{}";

    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

    let fields;
    try {
      fields = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", cleaned);
      fields = {
        phone: { valid: true, message: "Validation unavailable" },
        nationality: { valid: true, message: "Validation unavailable" },
        dateOfBirth: { valid: true, message: "Validation unavailable" },
      };
    }

    return new Response(JSON.stringify({ fields }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-profile-fields error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
