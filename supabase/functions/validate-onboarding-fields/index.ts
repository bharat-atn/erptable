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
    const {
      country, zipCode, city, address1, stateProvince,
      mobilePhone, emergencyPhone,
      bicCode, bankAccountNumber, bankName, bankCountry,
      birthday,
    } = await req.json();

    if (!country && !bankCountry) {
      return new Response(JSON.stringify({ fields: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are an expert in international addresses, phone numbers, and banking. Validate these onboarding form fields and return concise feedback.

Country of residence: "${country || "(not set)"}"

Fields to validate:
- Postcode: "${zipCode || ""}" (for country: ${country || "unknown"})
- City: "${city || ""}"
- State/Province: "${stateProvince || ""}"
- Street address: "${address1 || ""}"
- Mobile phone: "${mobilePhone || ""}"
- Emergency phone: "${emergencyPhone || ""}"
- Bank country: "${bankCountry || ""}"
- Bank name: "${bankName || ""}"
- BIC code: "${bicCode || ""}"
- Bank account number: "${bankAccountNumber || ""}"
- Birthday: "${birthday || ""}"

Validation rules:
1. POSTCODE: Check format matches the country's postal system. Sweden: "NNN NN" (5 digits with space). Romania: 6 digits. Thailand: 5 digits.
2. CITY: Is it a real city/town in that country? Does it roughly match the postcode region?
3. STATE/PROVINCE: Does it match the city?
4. ADDRESS: Does it follow local street naming conventions?
5. MOBILE PHONE: Check the dial code prefix matches a real country, total digit count is correct for that country.
6. EMERGENCY PHONE: Same phone validation.
7. BIC CODE: Must be 8 or 11 alphanumeric characters, valid SWIFT format. If bank name is provided, does BIC match?
8. BANK ACCOUNT: Check format is reasonable for the bank country (e.g. IBAN for EU countries).
9. BIRTHDAY: Format must be YYYY-MM-DD, age between 16-80.

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "fields": {
    "zipCode": { "valid": true/false/null, "message": "short explanation" },
    "city": { "valid": true/false/null, "message": "" },
    "stateProvince": { "valid": true/false/null, "message": "" },
    "address1": { "valid": true/false/null, "message": "" },
    "mobilePhone": { "valid": true/false/null, "message": "" },
    "emergencyPhone": { "valid": true/false/null, "message": "" },
    "bicCode": { "valid": true/false/null, "message": "" },
    "bankAccountNumber": { "valid": true/false/null, "message": "" },
    "birthday": { "valid": true/false/null, "message": "" }
  }
}

Use null if field was empty/not provided. Keep messages under 60 characters. Be helpful and specific.`;

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
      const errText = await response.text();
      console.error("AI gateway error:", errText);
      // Return empty result rather than failing
      return new Response(JSON.stringify({ fields: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ fields: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(JSON.stringify({ fields: {} }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
