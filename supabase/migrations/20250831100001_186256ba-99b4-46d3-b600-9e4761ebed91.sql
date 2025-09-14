-- Create 'documents' storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Policies for the 'documents' bucket
create policy if not exists "Public read access to documents"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy if not exists "Public upload to documents"
  on storage.objects for insert
  with check (bucket_id = 'documents');

create policy if not exists "Public update to documents"
  on storage.objects for update
  using (bucket_id = 'documents');

create policy if not exists "Public delete from documents"
  on storage.objects for delete
  using (bucket_id = 'documents');

-- Seed 10 employees for CureMed and 10 for Green Future
-- Using company IDs from existing data
with companies as (
  select id, name from public.companies where id in (
    'da28d9fa-5291-4716-9b28-3d5e79ea3524', -- CureMed
    '0893ca4f-488e-453b-a424-14cfb51356da'  -- Green Future
  )
)
insert into public.employees (
  id, company_id, name, phone, email, hire_date, birth_date, civil_id_no, residency_expiry_date, created_at, updated_at
)
select gen_random_uuid(), c.id,
       e.name,
       e.phone,
       e.email,
       e.hire_date,
       e.birth_date,
       e.civil_id_no,
       e.residency_expiry_date,
       now(), now()
from companies c
cross join (values
  -- 10 for CureMed (Arabic names)
  ('أحمد يوسف', '55680001', 'ahmad.yousef+curemed1@example.com', '2024-01-15', '1990-03-10', '287010300001', '2026-12-31'),
  ('محمد حسن', '55680002', 'mohammad.hassan+curemed2@example.com', '2023-11-01', '1988-07-22', '287010300002', '2026-10-15'),
  ('علي محمود', '55680003', 'ali.mahmoud+curemed3@example.com', '2022-05-10', '1992-01-05', '287010300003', '2027-02-20'),
  ('سعيد خالد', '55680004', 'saeed.khaled+curemed4@example.com', '2021-09-30', '1991-11-12', '287010300004', '2025-09-01'),
  ('حسين جابر', '55680005', 'hussain.jaber+curemed5@example.com', '2023-03-18', '1987-05-18', '287010300005', '2026-06-30'),
  ('مصطفى علي', '55680006', 'mostafa.ali+curemed6@example.com', '2020-12-05', '1989-09-09', '287010300006', '2025-12-31'),
  ('وليد فهد', '55680007', 'waleed.fahad+curemed7@example.com', '2022-08-20', '1993-02-14', '287010300007', '2027-03-15'),
  ('سامي أحمد', '55680008', 'sami.ahmad+curemed8@example.com', '2021-02-11', '1994-12-01', '287010300008', '2026-01-10'),
  ('جمال سالم', '55680009', 'jamal.salem+curemed9@example.com', '2023-06-01', '1995-04-25', '287010300009', '2027-07-07'),
  ('طارق ناصر', '55680010', 'tareq.nasser+curemed10@example.com', '2024-04-22', '1990-10-30', '287010300010', '2026-09-09'),
  -- 10 for Green Future (Arabic names)
  ('خالد عادل', '55681001', 'khaled.adel+green1@example.com', '2022-03-01', '1986-02-02', '287010300011', '2025-08-20'),
  ('رامي سعيد', '55681002', 'rami.saeed+green2@example.com', '2021-07-19', '1991-06-06', '287010300012', '2026-11-11'),
  ('حيدر كريم', '55681003', 'haidar.karim+green3@example.com', '2020-10-10', '1989-08-08', '287010300013', '2027-01-01'),
  ('فارس ماجد', '55681004', 'faris.majid+green4@example.com', '2023-02-14', '1992-12-12', '287010300014', '2026-04-04'),
  ('نبيل حسن', '55681005', 'nabil.hassan+green5@example.com', '2024-06-30', '1990-09-19', '287010300015', '2027-05-05'),
  ('مروان زهير', '55681006', 'marwan.zuhair+green6@example.com', '2022-11-05', '1993-03-23', '287010300016', '2025-10-10'),
  ('سلمان ظاهر', '55681007', 'salman.zahir+green7@example.com', '2021-01-21', '1988-04-27', '287010300017', '2026-02-02'),
  ('هشام أمين', '55681008', 'hisham.amin+green8@example.com', '2023-08-08', '1994-07-17', '287010300018', '2026-06-01'),
  ('باسل جمال', '55681009', 'basel.jamal+green9@example.com', '2024-12-12', '1995-01-29', '287010300019', '2027-08-18'),
  ('إياد رأفت', '55681010', 'eyad.rafat+green10@example.com', '2020-05-25', '1987-10-05', '287010300020', '2025-12-24')
) as e(name, phone, email, hire_date, birth_date, civil_id_no, residency_expiry_date)
where (
  (c.name = 'CureMed' and e.email like '%curemed%') or
  (c.name = 'Green Future' and e.email like '%green%')
)
-- avoid duplicate emails if re-run
on conflict do nothing;