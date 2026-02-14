
-- Create table to store daily schedule entries for contracts (used for time reporting)
CREATE TABLE public.contract_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  day_type TEXT NOT NULL DEFAULT 'Workday', -- Workday, Weekend, Holiday, Vacation, Off-season
  scheduled_hours NUMERIC NOT NULL DEFAULT 0,
  holiday_name_en TEXT,
  holiday_name_sv TEXT,
  start_time TEXT,
  end_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contract_id, schedule_date)
);

-- Enable RLS
ALTER TABLE public.contract_schedules ENABLE ROW LEVEL SECURITY;

-- HR staff can manage all schedule entries
CREATE POLICY "HR staff can manage contract_schedules"
ON public.contract_schedules
FOR ALL
USING (is_hr_user())
WITH CHECK (is_hr_user());

-- Index for fast lookups by contract
CREATE INDEX idx_contract_schedules_contract_id ON public.contract_schedules(contract_id);
CREATE INDEX idx_contract_schedules_date ON public.contract_schedules(schedule_date);
CREATE INDEX idx_contract_schedules_day_type ON public.contract_schedules(day_type);

-- Trigger for updated_at
CREATE TRIGGER update_contract_schedules_updated_at
BEFORE UPDATE ON public.contract_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
