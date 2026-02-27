
-- Add Romanian, Thai, and Ukrainian columns to positions table
ALTER TABLE public.positions
  ADD COLUMN label_ro text NOT NULL DEFAULT '',
  ADD COLUMN label_th text NOT NULL DEFAULT '',
  ADD COLUMN label_uk text NOT NULL DEFAULT '',
  ADD COLUMN type_label_ro text NOT NULL DEFAULT '',
  ADD COLUMN type_label_th text NOT NULL DEFAULT '',
  ADD COLUMN type_label_uk text NOT NULL DEFAULT '';

-- Add Romanian, Thai, and Ukrainian columns to skill_groups table
ALTER TABLE public.skill_groups
  ADD COLUMN label_ro text NOT NULL DEFAULT '',
  ADD COLUMN label_th text NOT NULL DEFAULT '',
  ADD COLUMN label_uk text NOT NULL DEFAULT '';
