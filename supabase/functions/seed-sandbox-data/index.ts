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
  { first_name: "Mihai", last_name: "Popa", email: "mihai.popa@forestry.com", phone: "+40723456789", city: "Bucharest", country: "Romania", status: "INACTIVE" },
  { first_name: "Elena", last_name: "Ionescu", email: "elena.ionescu@forestry.com", phone: "+40722345678", city: "Bucharest", country: "Romania", status: "ACTIVE" },
  { first_name: "Apinya", last_name: "Wongchai", email: "apinya.wongchai@forestry.com", phone: "+66832345678", city: "Bangkok", country: "Thailand", status: "ONBOARDING" },
  { first_name: "Niran", last_name: "Chairat", email: "niran.chairat@forestry.com", phone: "+66822345678", city: "Bangkok", country: "Thailand", status: "ACTIVE" },
  { first_name: "Somchai", last_name: "Rattanakul", email: "somchai.rattanakul@forestry.com", phone: "+66812345678", city: "Bangkok", country: "Thailand", status: "ACTIVE" },
  { first_name: "Andrei", last_name: "Popescu", email: "andrei.popescu@forestry.com", phone: "+40721234567", city: "Bucharest", country: "Romania", status: "ONBOARDING" },
  { first_name: "Anna", last_name: "Lindqvist", email: "anna.lindqvist@forestry.se", phone: "+46704567890", city: "Malmö", country: "Sweden", status: "ACTIVE" },
  { first_name: "Ana", last_name: "Dumitru", email: "ana.dumitru@forestry.com", phone: "+40724567890", city: "Cluj-Napoca", country: "Romania", status: "ACTIVE" },
  { first_name: "Yash", last_name: "Gandhi", email: "ygandhi@gmail.com", phone: "+919786368000", city: "Nagpur", country: "India", status: "INVITED" },
];

const SEED_CLIENTS = [
  { client_number: "CT-0001", company_name: "SCA Skog AB", contact_person: "Erik Svensson", email: "erik@scaskog.se", phone: "+46 70 123 4567", address: "Skogsvägen 12", city: "Östersund", postcode: "83135", country: "Sweden", status: "active" },
  { client_number: "CT-0002", company_name: "Sveaskog Norrland", contact_person: "Anna Johansson", email: "anna@sveaskog.se", phone: "+46 70 987 6543", address: "Industrigatan 5", city: "Umeå", postcode: "90320", country: "Sweden", status: "active" },
  { client_number: "CT-0003", company_name: "Holmen Skog AB", contact_person: "Lars Petersson", email: "lars.petersson@holmen.se", phone: "+46 60 456 7890", address: "Strandvägen 8", city: "Sundsvall", postcode: "85230", country: "Sweden", status: "active" },
  { client_number: "CT-0004", company_name: "Norra Skog", contact_person: "Maria Lindgren", email: "maria@norraskog.se", phone: "+46 70 234 5678", address: "Skogsindustrivägen 3", city: "Härnösand", postcode: "87133", country: "Sweden", status: "active" },
  { client_number: "CT-0005", company_name: "Stora Enso Forest", contact_person: "Anders Bergström", email: "anders.bergstrom@storaenso.com", phone: "+46 70 345 6789", address: "Bruksvägen 15", city: "Falun", postcode: "79131", country: "Sweden", status: "active" },
  { client_number: "CT-0006", company_name: "Södra Skogsägarna", contact_person: "Karin Nilsson", email: "karin.nilsson@sodra.com", phone: "+46 70 456 7801", address: "Skogsallén 22", city: "Växjö", postcode: "35234", country: "Sweden", status: "inactive" },
];

// Seed project to attach objects to
const SEED_PROJECT = {
  name: "Kvissleby Clearing 2026",
  project_id_display: "PJ-26-0001",
  type: "clearing",
  status: "active",
  location: "Kvissleby, Sundsvall",
  description: "Main clearing project for spring 2026 season",
  start_date: "2026-03-01",
  end_date: "2026-09-30",
  work_start_date: "2026-03-15",
  work_end_date: "2026-09-15",
  daily_hours: 8,
  start_time: "06:30",
  end_time: "17:00",
};

// Objects matching the screenshot reference
const SEED_OBJECTS = [
  { object_id_display: "D00001", name: "Forest Planting A", sla_class: "standard", area_hectares: null, description: "10000 forest plants", status: "registered" },
  { object_id_display: "D00002", name: "Forest Planting B", sla_class: "standard", area_hectares: null, description: "20000 forest plants", status: "registered" },
  { object_id_display: "D00003", name: "Forest Planting C", sla_class: "standard", area_hectares: null, description: "30000 forest plants", status: "registered" },
  { object_id_display: "D00004", name: "Forest Clearing A", sla_class: "standard", area_hectares: 100, description: null, status: "registered" },
  { object_id_display: "D00005", name: "Forest Clearing B", sla_class: "standard", area_hectares: 200, description: null, status: "planned" },
  { object_id_display: "D00006", name: "Forest Clearing C", sla_class: "difficult", area_hectares: 300, description: null, status: "planned" },
  { object_id_display: "D330470", name: "Young Forest Clearing 1", sla_class: "standard", area_hectares: 15.5, description: null, notes: "Young Forest Clearing – Scenario 1", status: "in_progress" },
  { object_id_display: "D330471", name: "Young Forest Clearing 2", sla_class: "standard", area_hectares: 12.3, description: null, notes: "Young Forest Clearing – Scenario 1", status: "in_progress" },
  { object_id_display: "D330472", name: "Undergrowth Clearing 1", sla_class: "difficult", area_hectares: 18.7, description: null, notes: "Forest Clearing Type 2 (Undergrowth) – Scenario 1", status: "registered" },
  { object_id_display: "D330473", name: "Undergrowth Clearing 2", sla_class: "difficult", area_hectares: 14.2, description: null, notes: "Forest Clearing Type 2 (Undergrowth) – Scenario 1", status: "registered" },
  { object_id_display: "D330474", name: "Undergrowth Clearing 3", sla_class: "extreme", area_hectares: 16.9, description: null, notes: "Forest Clearing Type 2 (Undergrowth) – Scenario 1", status: "registered" },
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
      await admin.from("forestry_objects").delete().eq("org_id", sandboxOrgId);
      await admin.from("forestry_project_members").delete().in("project_id",
        (await admin.from("forestry_projects").select("id").eq("org_id", sandboxOrgId)).data?.map((p: any) => p.id) || []
      );
      await admin.from("forestry_projects").delete().eq("org_id", sandboxOrgId);
      await admin.from("forestry_clients").delete().eq("org_id", sandboxOrgId);
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

    // Insert seed clients
    const clientRows = SEED_CLIENTS.map((c) => ({ ...c, org_id: sandboxOrgId }));
    const { data: insertedClients, error: cliErr } = await admin
      .from("forestry_clients")
      .insert(clientRows)
      .select("id");
    if (cliErr) throw cliErr;

    // Insert seed project (linked to first client)
    const firstClientId = insertedClients?.[0]?.id || null;
    const { data: insertedProject, error: projErr } = await admin
      .from("forestry_projects")
      .insert({
        ...SEED_PROJECT,
        org_id: sandboxOrgId,
        client_id: firstClientId,
        client: "SCA Skog AB",
      })
      .select("id")
      .single();
    if (projErr) throw projErr;
    const projectId = insertedProject?.id;

    // Insert seed objects linked to the project
    let objectsCreated = 0;
    if (projectId) {
      const objectRows = SEED_OBJECTS.map((o) => ({
        ...o,
        org_id: sandboxOrgId,
        project_id: projectId,
      }));
      const { data: insertedObjects, error: objErr } = await admin
        .from("forestry_objects")
        .insert(objectRows)
        .select("id");
      if (objErr) throw objErr;
      objectsCreated = insertedObjects?.length || 0;

      // Assign some ACTIVE employees as project members
      const activeEmps = insertedEmployees?.filter((e: any) => e.status === "ACTIVE") || [];
      if (activeEmps.length > 0) {
        const memberRows = activeEmps.map((e: any, i: number) => ({
          project_id: projectId,
          employee_id: e.id,
          role: i === 0 ? "leader" : "member",
          star_rating: Math.min(5, Math.max(1, 5 - i)),
        }));
        await admin.from("forestry_project_members").insert(memberRows);
      }
    }

    return new Response(
      JSON.stringify({
        companies: 1,
        employees: insertedEmployees?.length || 0,
        invitations: invitationsCreated,
        contracts: contractsCreated,
        clients: insertedClients?.length || 0,
        projects: 1,
        objects: objectsCreated,
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
