-- Create enum types for invitation and employee status
CREATE TYPE invitation_type AS ENUM ('NEW_HIRE', 'CONTRACT_RENEWAL');
CREATE TYPE invitation_status AS ENUM ('PENDING', 'SENT', 'ACCEPTED', 'EXPIRED');
CREATE TYPE employee_status AS ENUM ('INVITED', 'ONBOARDING', 'ACTIVE', 'INACTIVE');

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  personal_info JSONB DEFAULT '{}'::jsonb,
  status employee_status NOT NULL DEFAULT 'INVITED',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  type invitation_type NOT NULL,
  status invitation_status NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  season_year TEXT,
  start_date DATE,
  end_date DATE,
  salary DECIMAL(12, 2),
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for HR users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'hr_staff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees (HR users can manage all)
CREATE POLICY "HR users can view all employees" ON public.employees
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "HR users can insert employees" ON public.employees
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "HR users can update employees" ON public.employees
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for invitations
CREATE POLICY "HR users can view all invitations" ON public.invitations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "HR users can insert invitations" ON public.invitations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "HR users can update invitations" ON public.invitations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Public can read invitation by token (for employee portal)
CREATE POLICY "Anyone can view invitation by token" ON public.invitations
  FOR SELECT USING (true);

-- RLS Policies for contracts
CREATE POLICY "HR users can manage contracts" ON public.contracts
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();