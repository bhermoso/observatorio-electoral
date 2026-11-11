-- Depósito privado de originales para análisis propio. No contiene filas ni metadatos sensibles
-- visibles desde el Data API público. Acceso únicamente mediante servicio verificado.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('oee-microdatos-originales','oee-microdatos-originales',false,36700160,array['application/zip','application/octet-stream']::text[])
on conflict (id) do update
set public=false,file_size_limit=36700160,allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.microdata_originals (
 study_id text not null check (study_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
 sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
 size_bytes bigint not null check (size_bytes between 1 and 36700160),
 storage_path text not null unique,
 source_url text not null check (left(source_url,8)='https://'),
 permission_basis text not null check (char_length(permission_basis) between 16 and 900),
 reviewed_source text not null,
 bucket_id text not null default 'oee-microdatos-originales' check (bucket_id='oee-microdatos-originales'),
 status text not null default 'conservado_pendiente_homologacion'
   check (status in ('conservado_pendiente_homologacion','homologado')),
 stored_at timestamptz not null default now(),
 integrity_verified_at timestamptz not null,
 primary key (study_id, sha256),
 check (storage_path = study_id || '/' || sha256 || '.zip')
);
alter table public.microdata_originals enable row level security;
revoke all on public.microdata_originals from PUBLIC,anon,authenticated;
grant select,insert,update on public.microdata_originals to service_role;

comment on table public.microdata_originals is
 'Certificado interno de originales guardados con SHA-256, no contenido de entrevistas. No accesible públicamente.';

-- No hay políticas anon/authenticated sobre el bucket ni sobre storage.objects.
-- Los objetos privados solo son accesibles mediante service_role en el backend.
