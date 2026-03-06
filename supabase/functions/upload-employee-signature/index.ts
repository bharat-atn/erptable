import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, signatureDataUrl, signingPlace, signingDate } = await req.json();

    if (!token || typeof token !== "string" || token.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!signatureDataUrl || typeof signatureDataUrl !== "string" || !signatureDataUrl.startsWith("data:image/png;base64,")) {
      return new Response(JSON.stringify({ error: "Invalid signature data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Capture IP and User Agent server-side (eIDAS SES metadata)
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate token and get contract
    const { data: contracts, error: rpcErr } = await supabaseAdmin.rpc(
      "get_contract_for_signing",
      { _token: token }
    );

    if (rpcErr || !contracts || contracts.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid or expired signing link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contract = contracts[0];

    if (contract.signing_status !== "sent_to_employee") {
      return new Response(JSON.stringify({ error: "Contract is not awaiting employee signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 signature
    const base64Data = signatureDataUrl.replace("data:image/png;base64,", "");
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Limit file size (500KB max)
    if (bytes.length > 512000) {
      return new Response(JSON.stringify({ error: "Signature file too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filePath = `employee/${contract.contract_id}.png`;

    // Upload to storage using service role
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("signatures")
      .upload(filePath, bytes, { upsert: true, contentType: "image/png" });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "Failed to upload signature" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("signatures")
      .getPublicUrl(filePath);

    // Compute SHA-256 content hash of form_data for tamper evidence
    const contentHash = contract.form_data
      ? `sha256:${await sha256Hex(JSON.stringify(contract.form_data))}`
      : null;

    // Build eIDAS SES signing metadata
    const signingMetadata = {
      ip: clientIp,
      userAgent,
      place: signingPlace || null,
      date: signingDate || null,
      consentText: "I have read and agree to the contract terms. I have read and understood the Code of Conduct.",
      contentHash,
      signedAt: new Date().toISOString(),
    };

    // Submit signature via RPC with metadata
    const { error: submitErr } = await supabaseAdmin.rpc(
      "submit_employee_signature",
      {
        _token: token,
        _signature_url: urlData.publicUrl,
        _signing_metadata: signingMetadata,
      }
    );

    if (submitErr) {
      console.error("Submit error:", submitErr);
      return new Response(JSON.stringify({ error: "Failed to record signature" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, signatureUrl: urlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
