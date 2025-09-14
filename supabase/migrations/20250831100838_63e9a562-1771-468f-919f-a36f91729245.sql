-- Create 'documents' storage bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Drop existing policies
drop policy if exists "Public read access to documents" on storage.objects;
drop policy if exists "Public upload to documents" on storage.objects;
drop policy if exists "Public update to documents" on storage.objects;
drop policy if exists "Public delete from documents" on storage.objects;

-- Create policies for documents bucket
create policy "Public read access to documents"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Public upload to documents"
  on storage.objects for insert
  with check (bucket_id = 'documents');

create policy "Public update to documents"
  on storage.objects for update
  using (bucket_id = 'documents');

create policy "Public delete from documents"
  on storage.objects for delete
  using (bucket_id = 'documents');

-- Insert sample employees (no conflict constraint on email)
insert into public.employees (
  company_id, name, phone, email, hire_date, birth_date, civil_id_no, residency_expiry_date
) values
-- CureMed employees
('da28d9fa-5291-4716-9b28-3d5e79ea3524', 'أحمد يوسف', '55680001', 'ahmad.yousef@curemed.com', '2024-01-15', '1990-03-10', '287010300001', '2026-12-31'),
('da28d9fa-5291-4716-9b28-3d5e79ea3524', 'محمد حسن', '55680002', 'mohammad.hassan@curemed.com', '2023-11-01', '1988-07-22', '287010300002', '2026-10-15'),
('da28d9fa-5291-4716-9b28-3d5e79ea3524', 'علي محمود', '55680003', 'ali.mahmoud@curemed.com', '2022-05-10', '1992-01-05', '287010300003', '2027-02-20'),
('da28d9fa-5291-4716-9b28-3d5e79ea3524', 'سعيد خالد', '55680004', 'saeed.khaled@curemed.com', '2021-09-30', '1991-11-12', '287010300004', '2025-09-01'),
('da28d9fa-5291-4716-9b28-3d5e79ea3524', 'حسين جابر', '55680005', 'hussain.jaber@curemed.com', '2023-03-18', '1987-05-18', '287010300005', '2026-06-30'),
('da28d9fa-5291-4716-9b28-3d5e79ea3524', 'مصطفى علي', '55680006', 'mostafa.ali@curemed.com', '2020-12-05', '1989-09-09', '287010300006', '2025-12-31'),
('da28d9fa-5291-4716-9b28-3d5e79ea3524', 'وليد فهد', '55680007', 'waleed.fahad@curemed.com', '2022-08-20', '1993-02-14', '287010300007', '2027-03-15'),
('da28d9fa-5291-4716-9b28-3d5e79ea3524', 'سامي أحمد', '55680008', 'sami.ahmad@curemed.com', '2021-02-11', '1994-12-01', '287010300008', '2026-01-10'),
('da28d9fa-5291-4716-9b28-3d5e79ea3524', 'جمال سالم', '55680009', 'jamal.salem@curemed.com', '2023-06-01', '1995-04-25', '287010300009', '2027-07-07'),
('da28d9fa-5291-4716-9b28-3d5e79ea3524', 'طارق ناصر', '55680010', 'tareq.nasser@curemed.com', '2024-04-22', '1990-10-30', '287010300010', '2026-09-09'),
-- Green Future employees
('0893ca4f-488e-453b-a424-14cfb51356da', 'خالد عادل', '55681001', 'khaled.adel@greenfuture.com', '2022-03-01', '1986-02-02', '287010300011', '2025-08-20'),
('0893ca4f-488e-453b-a424-14cfb51356da', 'رامي سعيد', '55681002', 'rami.saeed@greenfuture.com', '2021-07-19', '1991-06-06', '287010300012', '2026-11-11'),
('0893ca4f-488e-453b-a424-14cfb51356da', 'حيدر كريم', '55681003', 'haidar.karim@greenfuture.com', '2020-10-10', '1989-08-08', '287010300013', '2027-01-01'),
('0893ca4f-488e-453b-a424-14cfb51356da', 'فارس ماجد', '55681004', 'faris.majid@greenfuture.com', '2023-02-14', '1992-12-12', '287010300014', '2026-04-04'),
('0893ca4f-488e-453b-a424-14cfb51356da', 'نبيل حسن', '55681005', 'nabil.hassan@greenfuture.com', '2024-06-30', '1990-09-19', '287010300015', '2027-05-05'),
('0893ca4f-488e-453b-a424-14cfb51356da', 'مروان زهير', '55681006', 'marwan.zuhair@greenfuture.com', '2022-11-05', '1993-03-23', '287010300016', '2025-10-10'),
('0893ca4f-488e-453b-a424-14cfb51356da', 'سلمان ظاهر', '55681007', 'salman.zahir@greenfuture.com', '2021-01-21', '1988-04-27', '287010300017', '2026-02-02'),
('0893ca4f-488e-453b-a424-14cfb51356da', 'هشام أمين', '55681008', 'hisham.amin@greenfuture.com', '2023-08-08', '1994-07-17', '287010300018', '2026-06-01'),
('0893ca4f-488e-453b-a424-14cfb51356da', 'باسل جمال', '55681009', 'basel.jamal@greenfuture.com', '2024-12-12', '1995-01-29', '287010300019', '2027-08-18'),
('0893ca4f-488e-453b-a424-14cfb51356da', 'إياد رأفت', '55681010', 'eyad.rafat@greenfuture.com', '2020-05-25', '1987-10-05', '287010300020', '2025-12-24');