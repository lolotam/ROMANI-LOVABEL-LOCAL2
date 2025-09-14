-- Update companies table to support Arabic and English names
ALTER TABLE public.companies DROP COLUMN IF EXISTS type;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS name_ar TEXT NOT NULL DEFAULT '';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS name_en TEXT NOT NULL DEFAULT '';

-- Update existing companies with sample data
UPDATE public.companies 
SET name_ar = CASE 
  WHEN name = 'GreenFuture' THEN 'شركة المستقبل الأخضر'
  WHEN name = 'CureMed' THEN 'شركة العلاج الطبي'
  ELSE name
END,
name_en = name
WHERE name_ar = '' OR name_en = '';

-- Remove the name column and use name_en instead
ALTER TABLE public.companies DROP COLUMN IF EXISTS name;
ALTER TABLE public.companies RENAME COLUMN name_en TO name;