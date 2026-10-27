-- مخطط قاعدة بيانات درس «مكانة الصلاة» على Supabase
-- نفّذ هذا الملف مرة واحدة من: Supabase → SQL Editor → New query → Run

create table if not exists public.salah_students (
  class_code text not null,
  student_id text not null,
  name text not null,
  section text not null,
  token text,
  completed jsonb not null default '{}'::jsonb,
  results jsonb not null default '{}'::jsonb,
  evaluation_score smallint not null default 0,
  percent smallint not null default 0,
  completed_count smallint not null default 0,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  last_active timestamptz not null default now(),
  primary key (class_code, student_id)
);

create index if not exists salah_students_class_idx
  on public.salah_students (class_code, last_active desc);

-- الوصول يتم فقط عبر دوال Vercel باستخدام مفتاح service_role،
-- لذلك نُغلق الجدول أمام المفتاح العام (anon).
alter table public.salah_students enable row level security;

comment on table public.salah_students is 'سجلات تقدّم طلاب درس مكانة الصلاة — تُدار عبر دوال Vercel';
