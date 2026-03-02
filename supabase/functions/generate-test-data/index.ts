import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { nationality, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const currentYear = new Date().getFullYear();
    const minBirthYear = currentYear - 60;
    const maxBirthYear = currentYear - 20;

    const countryHint = nationality || "Romanian";

    const systemPrompt = `You are a realistic test data generator for a forestry worker onboarding form. 
Generate realistic but fake personal data for a ${countryHint} seasonal forestry worker coming to work in Sweden.

CRITICAL RULES:
- Phone numbers: exactly 9 digits, NO leading zero, digits only (e.g. "701820168" for Sweden, "723456789" for Romania)
- Bank account numbers: ONLY digits, no letters, no spaces (e.g. "12345678901234" for Romania, "12345678901" for Sweden)
- Birthday: YYYY-MM-DD format, age between 20-60 years old (birth year ${minBirthYear}-${maxBirthYear})
- BIC codes: valid format, uppercase letters and digits (e.g. "BTRLRO22", "SWEDSESS")
- All names should be culturally appropriate for the nationality
- Address should be a realistic address in the worker's home country
- Emergency contact should be a family member with same nationality
- Email should be a realistic format using the person's name

COUNTRY-SPECIFIC VALIDATION RULES:
- Romania: Phone prefix +40, 9 digits, cities like București, Cluj-Napoca, Brașov, Timișoara. Postcodes 6 digits. States like "Cluj", "Brașov", "Timiș".
- Thailand: Phone prefix +66, 9 digits, cities like Bangkok, Chiang Mai, Udon Thani. Postcodes 5 digits. Provinces like "Chiang Mai", "Udon Thani".
- Sweden: Phone prefix +46, 7-9 digits, cities like Stockholm, Göteborg, Sundsvall. Postcodes 5 digits (NNN NN). Counties like "Västernorrland", "Jämtland".
- Ukraine: Phone prefix +380, 9 digits, cities like Kyiv, Lviv, Kharkiv, Odesa, Dnipro. Postcodes 5 digits. Oblasts like "Kyivska", "Lvivska", "Kharkivska".

IMPORTANT: The address country, country of birth, citizenship, phone prefix, and emergency phone prefix must ALL be consistent with the "${countryHint}" nationality. 
- If Romanian worker: country=Romania, phone prefix=+40, emergency phone prefix=+40
- If Thai worker: country=Thailand, phone prefix=+66, emergency phone prefix=+66  
- If Swedish worker: country=Sweden, phone prefix=+46, emergency phone prefix=+46
- If Ukrainian worker: country=Ukraine, phone prefix=+380, emergency phone prefix=+380

Return a JSON object with these exact keys:
{
  "firstName": "string",
  "middleName": "string or empty",
  "lastName": "string",
  "preferredName": "string (usually first name or nickname)",
  "address1": "string (street address)",
  "address2": "string or empty",
  "zipCode": "string",
  "city": "string",
  "stateProvince": "string",
  "country": "string (full country name)",
  "birthday": "YYYY-MM-DD",
  "countryOfBirth": "string (full country name)",
  "citizenship": "string (full country name)",
  "mobilePhonePrefix": "string (e.g. +40, +46, +66)",
  "mobilePhoneNumber": "string (9 digits, no leading zero)",
  "email": "string",
  "bankCountry": "string (Romania, Sweden, or Thailand)",
  "bankName": "string (a real bank in that country)",
  "bicCode": "string (valid BIC/SWIFT code)",
  "bankAccountNumber": "string (digits only, realistic length)",
  "emergencyFirstName": "string",
  "emergencyLastName": "string",
  "emergencyPhonePrefix": "string (MUST match nationality prefix)",
  "emergencyPhoneNumber": "string (9 digits, no leading zero)"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate realistic test data for a ${countryHint} worker. Language context: ${language || "en_sv"}. Return ONLY the JSON object, no markdown.` },
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in your workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      
      // Post-generation validation & cleanup
      // Ensure phone numbers are digits only, no leading zero
      if (parsed.mobilePhoneNumber) {
        parsed.mobilePhoneNumber = parsed.mobilePhoneNumber.replace(/\D/g, "").replace(/^0+/, "");
      }
      if (parsed.emergencyPhoneNumber) {
        parsed.emergencyPhoneNumber = parsed.emergencyPhoneNumber.replace(/\D/g, "").replace(/^0+/, "");
      }
      // Ensure bank account is digits only
      if (parsed.bankAccountNumber) {
        parsed.bankAccountNumber = parsed.bankAccountNumber.replace(/\D/g, "");
      }
      // Validate birthday is reasonable
      if (parsed.birthday) {
        const birthYear = parseInt(parsed.birthday.slice(0, 4));
        if (birthYear < minBirthYear || birthYear > maxBirthYear) {
          const safeYear = minBirthYear + Math.floor(Math.random() * (maxBirthYear - minBirthYear));
          parsed.birthday = `${safeYear}${parsed.birthday.slice(4)}`;
        }
      }
      // Ensure country consistency based on nationality
      const nationalityMap: Record<string, { country: string; prefix: string }> = {
        "Romanian": { country: "Romania", prefix: "+40" },
        "Thai": { country: "Thailand", prefix: "+66" },
        "Swedish": { country: "Sweden", prefix: "+46" },
        "Ukrainian": { country: "Ukraine", prefix: "+380" },
      };
      const nat = nationalityMap[countryHint];
      if (nat) {
        if (!parsed.country) parsed.country = nat.country;
        if (!parsed.countryOfBirth) parsed.countryOfBirth = nat.country;
        if (!parsed.citizenship) parsed.citizenship = nat.country;
        if (!parsed.mobilePhonePrefix) parsed.mobilePhonePrefix = nat.prefix;
        if (!parsed.emergencyPhonePrefix) parsed.emergencyPhonePrefix = nat.prefix;
      }
      
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      console.error("Failed to parse AI response:", jsonStr);
      return new Response(JSON.stringify({ error: "Failed to generate test data. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("generate-test-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
