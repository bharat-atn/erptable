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
  { first_name: "Andrei", last_name: "Popescu", email: "andrei.popescu@forestry.com", phone: "+40721234567", city: "Bucharest", country: "Romania", status: "ACTIVE" },
  { first_name: "Anna", last_name: "Lindqvist", email: "anna.lindqvist@forestry.se", phone: "+46704567890", city: "Malmö", country: "Sweden", status: "ACTIVE" },
  { first_name: "Ana", last_name: "Dumitru", email: "ana.dumitru@forestry.com", phone: "+40724567890", city: "Cluj-Napoca", country: "Romania", status: "ACTIVE" },
  { first_name: "Yash", last_name: "Gandhi", email: "ygandhi@gmail.com", phone: "+919786368000", city: "Nagpur", country: "India", status: "INVITED" },
];

// Scenario 1 star-rating map: employee email → star rating
const STAR_RATINGS: Record<string, number> = {
  "anna.lindqvist@forestry.se": 5,
  "niran.chairat@forestry.com": 3,
  "andrei.popescu@forestry.com": 2,
  "somchai.rattanakul@forestry.com": 2,
  "elena.ionescu@forestry.com": 4,
  "ana.dumitru@forestry.com": 3,
};

const SEED_CLIENTS = [
  { client_number: "CT-0001", company_name: "Swedish Forestry Corporation", contact_person: "Karl Gustavsson", email: "karl@sweforest.se", phone: "+46 70 111 2233", address: "Skogsvägen 1", city: "Karlstad", postcode: "65225", country: "Sweden", status: "active" },
  { client_number: "CT-0002", company_name: "SCA Skog AB", contact_person: "Erik Svensson", email: "erik@scaskog.se", phone: "+46 70 123 4567", address: "Skogsvägen 12", city: "Östersund", postcode: "83135", country: "Sweden", status: "active" },
  { client_number: "CT-0003", company_name: "Sveaskog Norrland", contact_person: "Anna Johansson", email: "anna@sveaskog.se", phone: "+46 70 987 6543", address: "Industrigatan 5", city: "Umeå", postcode: "90320", country: "Sweden", status: "active" },
  { client_number: "CT-0004", company_name: "Holmen Skog AB", contact_person: "Lars Petersson", email: "lars.petersson@holmen.se", phone: "+46 60 456 7890", address: "Strandvägen 8", city: "Sundsvall", postcode: "85230", country: "Sweden", status: "active" },
  { client_number: "CT-0005", company_name: "Norra Skog", contact_person: "Maria Lindgren", email: "maria@norraskog.se", phone: "+46 70 234 5678", address: "Skogsindustrivägen 3", city: "Härnösand", postcode: "87133", country: "Sweden", status: "active" },
  { client_number: "CT-0006", company_name: "Nordic Green Solutions AB", contact_person: "Karin Nilsson", email: "karin@nordicgreen.se", phone: "+46 70 345 6789", address: "Plantvägen 4", city: "Borlänge", postcode: "78132", country: "Sweden", status: "active" },
  { client_number: "CT-0007", company_name: "Scandinavian Forest Alliance", contact_person: "Anders Bergström", email: "anders@scanforest.se", phone: "+46 70 456 7801", address: "Skogsallén 22", city: "Falun", postcode: "79131", country: "Sweden", status: "active" },
];

// Seed project matching Scenario 1: Forest Clearing Project
const SEED_PROJECT = {
  name: "Värmland Forest Clearing 2026",
  project_id_display: "PJ-26-0001",
  type: "clearing",
  status: "active",
  location: "Värmland, Sweden",
  description: "Scenario 1 – Forest clearing project for Swedish Forestry Corporation. 3 objects, 49.8 hectares total, SLA 107, piece-work compensation.",
  start_date: "2026-05-01",
  end_date: "2026-07-31",
  work_start_date: "2026-06-10",
  work_end_date: "2026-06-12",
  daily_hours: 8,
  start_time: "06:30",
  end_time: "17:00",
  budget: 124500,
  revenue: 124500,
};

// 3 clearing objects matching Scenario 1: all SLA 107
const SEED_OBJECTS = [
  { object_id_display: "D330474", name: "Undergrowth Clearing – North Ridge", sla_class: "107", area_hectares: 15.2, description: "Forest Clearing Type 2 (Undergrowth)", notes: "Scenario 1 – Object 1", status: "registered" },
  { object_id_display: "D330473", name: "Undergrowth Clearing – East Slope", sla_class: "107", area_hectares: 18.4, description: "Forest Clearing Type 2 (Undergrowth)", notes: "Scenario 1 – Object 2", status: "registered" },
  { object_id_display: "D330472", name: "Undergrowth Clearing – South Valley", sla_class: "107", area_hectares: 16.2, description: "Forest Clearing Type 2 (Undergrowth)", notes: "Scenario 1 – Object 3", status: "registered" },
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
      // Reset comp group data
      await admin.from("comp_group_classes").delete().eq("org_id", sandboxOrgId);
      await admin.from("comp_group_types").delete().eq("org_id", sandboxOrgId);
      await admin.from("comp_groups").delete().eq("org_id", sandboxOrgId);
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
      .select("id, company_name");
    if (cliErr) throw cliErr;

    // Find the "Swedish Forestry Corporation" client for Scenario 1
    const sweForestClient = insertedClients?.find((c: any) => c.company_name === "Swedish Forestry Corporation");

    // Insert seed project (linked to Swedish Forestry Corporation)
    const { data: insertedProject, error: projErr } = await admin
      .from("forestry_projects")
      .insert({
        ...SEED_PROJECT,
        org_id: sandboxOrgId,
        client_id: sweForestClient?.id || null,
        client: "Swedish Forestry Corporation",
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

      // Assign Scenario 1 team members with correct star ratings
      // Anna (5★), Niran (3★), Andrei (2★), Somchai (2★)
      const scenarioTeamEmails = [
        "anna.lindqvist@forestry.se",
        "niran.chairat@forestry.com",
        "andrei.popescu@forestry.com",
        "somchai.rattanakul@forestry.com",
      ];
      const teamEmps = insertedEmployees?.filter((e: any) => scenarioTeamEmails.includes(e.email)) || [];
      if (teamEmps.length > 0) {
        const memberRows = teamEmps.map((e: any) => ({
          project_id: projectId,
          employee_id: e.id,
          role: e.email === "anna.lindqvist@forestry.se" ? "leader" : "member",
          star_rating: STAR_RATINGS[e.email] || 1,
        }));
        await admin.from("forestry_project_members").insert(memberRows);
      }
    }

    // Seed Compensation Group for Scenario 1: SLA 107 Piece Work
    const { data: compGroup, error: cgErr } = await admin
      .from("comp_groups")
      .insert({
        org_id: sandboxOrgId,
        name: "Clearing – Piece Work",
        category: "clearing",
        method: "piece_work",
        sort_order: 1,
      })
      .select("id")
      .single();

    let compClassesCreated = 0;
    if (!cgErr && compGroup) {
      // SLA 107 rates: Star 1→108, Star 2→144, Star 3→162, Star 4→180, Star 5→198 SEK/h
      const classRows = [
        { org_id: sandboxOrgId, group_id: compGroup.id, sla_class_id: "107", type_label: "Forest Clearing Type 2 (Undergrowth)", client: "Swedish Forestry Corporation", star_1: 108, star_2: 144, star_3: 162, star_4: 180, star_5: 198, hourly_gross: 162, net_value: 2500, sort_order: 1 },
        { org_id: sandboxOrgId, group_id: compGroup.id, sla_class_id: "105", type_label: "Young Forest Clearing", client: "Swedish Forestry Corporation", star_1: 90, star_2: 120, star_3: 135, star_4: 150, star_5: 165, hourly_gross: 135, net_value: 2000, sort_order: 2 },
        { org_id: sandboxOrgId, group_id: compGroup.id, sla_class_id: "109", type_label: "Heavy Undergrowth Clearing", client: "Swedish Forestry Corporation", star_1: 126, star_2: 168, star_3: 189, star_4: 210, star_5: 231, hourly_gross: 189, net_value: 3000, sort_order: 3 },
      ];
      const { data: insertedClasses, error: ccErr } = await admin
        .from("comp_group_classes")
        .insert(classRows)
        .select("id");
      if (!ccErr) compClassesCreated = insertedClasses?.length || 0;
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
        comp_classes: compClassesCreated,
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
