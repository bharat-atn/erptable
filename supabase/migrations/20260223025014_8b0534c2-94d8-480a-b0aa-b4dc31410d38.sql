-- Add age_group column to agreement_periods
-- Values: '19_plus' (default for workers 19+), '18', '17', '16' (for under-19)
ALTER TABLE public.agreement_periods
ADD COLUMN age_group text NOT NULL DEFAULT '19_plus';

-- Update existing records to explicitly set age_group
UPDATE public.agreement_periods SET age_group = '19_plus' WHERE age_group = '19_plus';
