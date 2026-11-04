-- =============================================================================
-- NAVEGANDO MKT • VINCULAÇÃO AUTOMÁTICA DE LOGINS (auth.users -> agency_members)
-- Execute no SQL Editor do Supabase caso queira persistir o vínculo no banco.
-- O servidor Next.js (src/lib/server/workspace-api.ts) também já faz essa
-- identificação automaticamente pelo e-mail ou nome do usuário no login!
-- =============================================================================

with roster (token, employee_id, role) as (
  values
    ('felipe',    'usr-felipe',      'dono'),
    ('gui',       'usr-gui',         'dono'),
    ('guilherme', 'usr-gui',         'dono'),
    ('matheus',   'usr-matheus-ger', 'gerente'),
    ('alexandre', 'usr-alexandre',   'gerente'),
    ('ale',       'usr-alexandre',   'gerente'),
    ('larissa',   'usr-larissa',     'gerente'),
    ('lari',      'usr-larissa',     'gerente'),
    ('victor',    'usr-victor',      'filmmaker'),
    ('vitor',     'usr-victor',      'filmmaker'),
    ('gimenez',   'usr-gimenez',     'filmmaker'),
    ('henry',     'usr-henry',       'filmmaker'),
    ('isadora',   'usr-isa',         'modelo'),
    ('isa',       'usr-isa',         'modelo'),
    ('giovana',   'usr-gi',          'modelo'),
    ('giovanna',  'usr-gi',          'modelo'),
    ('gi',        'usr-gi',          'modelo'),
    ('milena',    'usr-mi',          'modelo'),
    ('mi',        'usr-mi',          'modelo'),
    ('juliacamp', 'usr-ju',          'modelo'),
    ('ju',        'usr-ju',          'modelo'),
    ('carol',     'usr-carol',       'interno'),
    ('carolina',  'usr-carol',       'interno'),
    ('bruna',     'usr-bruna',       'interno'),
    ('lucas',     'usr-lucas',       'interno'),
    ('evelin',    'usr-evelin',      'interno'),
    ('evelyn',    'usr-evelin',      'interno'),
    ('juliaint',  'usr-juliaint',    'interno'),
    ('julia',     'usr-juliaint',    'interno'),
    ('augusto',   'usr-augusto',     'interno'),
    ('guto',      'usr-augusto',     'interno')
),
matched as (
  select distinct on (r.employee_id)
    u.id as user_id,
    r.employee_id,
    r.role,
    u.email
  from auth.users u
  join roster r
    on regexp_replace(lower(split_part(coalesce(u.email, ''), '@', 1)), '[^a-z0-9]', '', 'g') = r.token
    or regexp_replace(lower(split_part(coalesce(u.email, ''), '@', 1)), '[^a-z0-9]', '', 'g') like r.token || '%'
  order by r.employee_id, length(r.token) desc, u.created_at desc
)
insert into public.agency_members (user_id, employee_id, role, active)
select user_id, employee_id, role, true
from matched
on conflict (employee_id) do update
  set user_id = excluded.user_id,
      role    = excluded.role,
      active  = true,
      updated_at = clock_timestamp();

-- Exibe os logins vinculados e suas respectivas hierarquias:
select
  m.employee_id as "ID Funcionário",
  m.role as "Hierarquia",
  u.email as "E-mail do Login",
  m.active as "Ativo"
from public.agency_members m
join auth.users u on u.id = m.user_id
order by m.role, m.employee_id;

