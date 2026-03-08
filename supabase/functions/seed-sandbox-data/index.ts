import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SEED_COMPANY = {
  name: "Ljungan Skogsbruk AB",
  org_number: "556123-4567",
  address: "Skogsvägen 12",
  postcode: "86232",
  city: "KVISSLEBY",
  country: "Sweden",
  phone: "+46601234567",
  email: "info@ljungan-skog.se",
  website: "https://ljungan-skog.se",
  bankgiro: "123-4567",
  ceo_name: "Anders Ljungberg",
  company_type: "Aktiebolag",
};

const SEED_EMPLOYEES = [
  { first_name: "Erik", last_name: "Johansson", email: "erik.johansson@sandbox.test", phone: "+46701234567", city: "Stockholm", country: "Sweden", status: "ACTIVE" },
  { first_name: "Anna", last_name: "Lindqvist", email: "anna.lindqvist@sandbox.test", phone: "+46702345678", city: "Göteborg", country: "Sweden", status: "ACTIVE" },
  { first_name: "Ion", last_name: "Popescu", email: "ion.popescu@sandbox.test", phone: "+40721234567", city: "Cluj-Napoca", country: "Romania", status: "ONBOARDING" },
  { first_name: "Maria", last_name: "Ionescu", email: "maria.ionescu@sandbox.test", phone: "+40731234567", city: "Bucharest", country: "Romania", status: "ONBOARDING" },
  { first_name: "Somchai", last_name: "Thongkam", email: "somchai.thongkam@sandbox.test", phone: "+66812345678", city: "Bangkok", country: "Thailand", status: "INVITED" },
  { first_name: "Nattaya", last_name: "Srisuk", email: "nattaya.srisuk@sandbox.test", phone: "+66823456789", city: "Chiang Mai", country: "Thailand", status: "INVITED" },
  { first_name: "Lars", last_name: "Svensson", email: "lars.svensson@sandbox.test", phone: "+46703456789", city: "Malmö", country: "Sweden", status: "INACTIVE" },
  { first_name: "Petra", last_name: "Nilsson", email: "petra.nilsson@sandbox.test", phone: "+46704567890", city: "Uppsala", country: "Sweden", status: "ACTIVE" },
];

const SEED_CLIENTS = [
  { client_number: "CT-0001", company_name: "SCA Skog AB", contact_person: "Erik Svensson", email: "erik@scaskog.se", phone: "+46 70 123 4567", address: "Skogsvägen 12", city: "Östersund", postcode: "83135", country: "Sweden", status: "active" },
  { client_number: "CT-0002", company_name: "Sveaskog Norrland", contact_person: "Anna Johansson", email: "anna@sveaskog.se", phone: "+46 70 987 6543", address: "Industrigatan 5", city: "Umeå", postcode: "90320", country: "Sweden", status: "active" },
  { client_number: "CT-0003", company_name: "Holmen Skog AB", contact_person: "Lars Petersson", email: "lars.petersson@holmen.se", phone: "+46 60 456 7890", address: "Strandvägen 8", city: "Sundsvall", postcode: "85230", country: "Sweden", status: "active" },
  { client_number: "CT-0004", company_name: "Norra Skog", contact_person: "Maria Lindgren", email: "maria@norraskog.se", phone: "+46 70 234 5678", address: "Skogsindustrivägen 3", city: "Härnösand", postcode: "87133", country: "Sweden", status: "active" },
  { client_number: "CT-0005", company_name: "Stora Enso Forest", contact_person: "Anders Bergström", email: "anders.bergstrom@storaenso.com", phone: "+46 70 345 6789", address: "Bruksvägen 15", city: "Falun", postcode: "79131", country: "Sweden", status: "active" },
  { client_number: "CT-0006", company_name: "Södra Skogsägarna", contact_person: "Karin Nilsson", email: "karin.nilsson@sodra.com", phone: "+46 70 456 7801", address: "Skogsallén 22", city: "Växjö", postcode: "35234", country: "Sweden", status: "inactive" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isAdmin } = await userClient.rpc("is_super_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sandboxOrgId, resetFirst } = await req.json();
    if (!sandboxOrgId) {
      return new Response(JSON.stringify({ error: "sandboxOrgId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Optionally reset existing sandbox data
    if (resetFirst) {
      await admin.from("contract_schedules").delete().eq("org_id", sandboxOrgId);
      await admin.from("contracts").delete().eq("org_id", sandboxOrgId);
      await admin.from("invitations").delete().eq("org_id", sandboxOrgId);
      await admin.from("employees").delete().eq("org_id", sandboxOrgId);
      await admin.from("companies").delete().eq("org_id", sandboxOrgId);
    }

    // Insert seed company
    const { data: insertedCompany, error: compErr } = await admin
      .from("companies")
      .insert({ ...SEED_COMPANY, org_id: sandboxOrgId })
      .select("id")
      .single();

    if (compErr) throw compErr;
    const companyId = insertedCompany?.id;

    // Insert employees
    const employeeRows = SEED_EMPLOYEES.map((e) => ({
      ...e,
      org_id: sandboxOrgId,
      personal_info: {
        mobilePhone: e.phone,
        city: e.city,
        country: e.country,
      },
    }));

    const { data: insertedEmployees, error: empErr } = await admin
      .from("employees")
      .insert(employeeRows)
      .select("id, email, status");

    if (empErr) throw empErr;

    // Create invitations for INVITED employees
    const invitedEmps = insertedEmployees?.filter((e: any) => e.status === "INVITED") || [];
    const invitationRows = invitedEmps.map((e: any) => ({
      employee_id: e.id,
      org_id: sandboxOrgId,
      type: "NEW_HIRE",
      status: "SENT",
      language: "en_sv",
    }));

    let invitationsCreated = 0;
    if (invitationRows.length > 0) {
      const { data: invs, error: invErr } = await admin
        .from("invitations")
        .insert(invitationRows)
        .select("id");
      if (invErr) throw invErr;
      invitationsCreated = invs?.length || 0;
    }

    // Create draft contracts for ONBOARDING employees
    const onboardingEmps = insertedEmployees?.filter((e: any) => e.status === "ONBOARDING") || [];
    const contractRows = onboardingEmps.map((e: any) => ({
      employee_id: e.id,
      org_id: sandboxOrgId,
      company_id: companyId,
      status: "draft",
      signing_status: "not_sent",
      season_year: new Date().getFullYear().toString(),
    }));

    let contractsCreated = 0;
    if (contractRows.length > 0) {
      const { data: cts, error: ctErr } = await admin
        .from("contracts")
        .insert(contractRows)
        .select("id");
      if (ctErr) throw ctErr;
      contractsCreated = cts?.length || 0;
    }

    return new Response(
      JSON.stringify({
        companies: 1,
        employees: insertedEmployees?.length || 0,
        invitations: invitationsCreated,
        contracts: contractsCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
