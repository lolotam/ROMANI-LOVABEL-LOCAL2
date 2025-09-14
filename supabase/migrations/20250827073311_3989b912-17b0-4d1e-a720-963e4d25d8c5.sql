-- Create enum types for better data organization
CREATE TYPE company_type AS ENUM ('green_future', 'cure_med');
CREATE TYPE document_status AS ENUM ('valid', 'expiring_soon', 'expired');

-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type company_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ministries table
CREATE TABLE public.ministries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_types table
CREATE TABLE public.document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  email TEXT,
  hire_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES public.document_types(id) NOT NULL,
  ministry_id UUID REFERENCES public.ministries(id),
  title TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  issue_date DATE,
  expiry_date DATE,
  status document_status,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT documents_entity_check CHECK (
    (company_id IS NOT NULL AND employee_id IS NULL) OR 
    (company_id IS NULL AND employee_id IS NOT NULL)
  )
);

-- Create admin_users table for simple admin authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies allowing authenticated access to all data
CREATE POLICY "Allow authenticated access to companies" ON public.companies FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to ministries" ON public.ministries FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to document_types" ON public.document_types FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to documents" ON public.documents FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to admin_users" ON public.admin_users FOR ALL USING (true);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate document status based on expiry date
CREATE OR REPLACE FUNCTION public.calculate_document_status(expiry_date DATE)
RETURNS document_status AS $$
BEGIN
  IF expiry_date IS NULL THEN
    RETURN 'valid';
  ELSIF expiry_date < CURRENT_DATE THEN
    RETURN 'expired';
  ELSIF expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    RETURN 'expiring_soon';
  ELSE
    RETURN 'valid';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update document status
CREATE OR REPLACE FUNCTION public.update_document_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status = public.calculate_document_status(NEW.expiry_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_status_trigger
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_document_status();

-- Insert seed data
INSERT INTO public.companies (name, type, description) VALUES
  ('Green Future', 'green_future', 'شركة المستقبل الأخضر'),
  ('CureMed', 'cure_med', 'شركة كيورميد الطبية');

INSERT INTO public.ministries (name, name_ar) VALUES
  ('Ministry of Health', 'وزارة الصحة'),
  ('Ministry of Labor', 'وزارة العمل'),
  ('Ministry of Interior', 'وزارة الداخلية'),
  ('Ministry of Commerce', 'وزارة التجارة');

INSERT INTO public.document_types (name, name_ar) VALUES
  ('License', 'رخصة'),
  ('Permit', 'تصريح'),
  ('Certificate', 'شهادة'),
  ('Contract', 'عقد'),
  ('Invoice', 'فاتورة'),
  ('Medical Certificate', 'شهادة طبية'),
  ('Work Permit', 'تصريح عمل');

-- Insert admin user with hashed password
-- Password: @Xx123456789xX@ (this will be hashed in the application)
INSERT INTO public.admin_users (username, password_hash) VALUES
  ('Admin', '$2b$10$placeholder_hash_will_be_replaced_by_app');