
-- Create forestry_clients table
CREATE TABLE public.forestry_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_number TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postcode TEXT,
  country TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forestry_clients ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Org members can view forestry clients"
  ON public.forestry_clients FOR SELECT
  TO authenticated
  USING (public.is_org_member_current(org_id));

CREATE POLICY "Org members can insert forestry clients"
  ON public.forestry_clients FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member_current(org_id));

CREATE POLICY "Org members can update forestry clients"
  ON public.forestry_clients FOR UPDATE
  TO authenticated
  USING (public.is_org_member_current(org_id));

CREATE POLICY "Org members can delete forestry clients"
  ON public.forestry_clients FOR DELETE
  TO authenticated
  USING (public.is_org_member_current(org_id));

-- Auto-update trigger
CREATE TRIGGER update_forestry_clients_updated_at
  BEFORE UPDATE ON public.forestry_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trigger
CREATE TRIGGER audit_forestry_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.forestry_clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Unique constraint on client_number per org
ALTER TABLE public.forestry_clients ADD CONSTRAINT forestry_clients_org_number_unique UNIQUE (org_id, client_number);
