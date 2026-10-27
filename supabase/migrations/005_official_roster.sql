-- Official roster only. Auth accounts are linked later using the provisioning script.
begin;
insert into public.agency_members(employee_id,role,employee) values
('usr-felipe','dono','{"id": "usr-felipe", "nome": "Felipe Assis", "username": "felipe", "funcao": "dono", "regime": "interno", "cargo_detalhado": "Dono & Diretor Executivo", "cor": 12, "ativo": true}'::jsonb),
('usr-gabriela','dono','{"id": "usr-gabriela", "nome": "Gabriela Lorente", "username": "gabriela", "funcao": "dono", "regime": "interno", "cargo_detalhado": "Dona & Diretora de Operações", "cor": 340, "ativo": true}'::jsonb),
('usr-alexandre','gerente','{"id": "usr-alexandre", "nome": "Alexandre", "username": "alexandre", "funcao": "gerente", "regime": "interno", "cargo_detalhado": "Gerente Geral & Contas", "cor": 215, "ativo": true}'::jsonb),
('usr-vitinho','gerente','{"id": "usr-vitinho", "nome": "Victor Cordoba", "username": "vitinho", "funcao": "gerente", "regime": "externo", "cargo_detalhado": "Gerente de Produção & Filmmaker Líder", "cor": 205, "ativo": true}'::jsonb),
('usr-matheus-ger','gerente','{"id": "usr-matheus-ger", "nome": "Matheus", "username": "matheus", "funcao": "gerente", "regime": "interno", "cargo_detalhado": "Gerente Operacional", "cor": 155, "ativo": true}'::jsonb),
('usr-larissa','gerente','{"id": "usr-larissa", "nome": "Larissa", "username": "larissa", "funcao": "gerente", "regime": "interno", "cargo_detalhado": "Gerente de Atendimento & Social Media", "cor": 285, "ativo": true}'::jsonb),
('usr-victor','filmmaker','{"id": "usr-victor", "nome": "Victor", "username": "victor", "funcao": "filmmaker", "regime": "externo", "cargo_detalhado": "Filmmaker Gastronômico", "cor": 178, "ativo": true}'::jsonb),
('usr-gimenez','filmmaker','{"id": "usr-gimenez", "nome": "Matheus Gimenez", "username": "gimenez", "funcao": "filmmaker", "regime": "externo", "cargo_detalhado": "Filmmaker Gastronômico", "cor": 148, "ativo": true}'::jsonb),
('usr-henry','filmmaker','{"id": "usr-henry", "nome": "Henry", "username": "henry", "funcao": "filmmaker", "regime": "externo", "cargo_detalhado": "Filmmaker Gastronômico", "cor": 238, "ativo": true}'::jsonb),
('usr-isa','modelo','{"id": "usr-isa", "nome": "Isa", "username": "isa", "funcao": "modelo", "regime": "externo", "cargo_detalhado": "Apresentadora & Modelo Gastronômica", "cor": 275, "ativo": true}'::jsonb),
('usr-gi','modelo','{"id": "usr-gi", "nome": "Gi", "username": "gi", "funcao": "modelo", "regime": "externo", "cargo_detalhado": "Apresentadora & Modelo Gastronômica", "cor": 320, "ativo": true}'::jsonb),
('usr-mi','modelo','{"id": "usr-mi", "nome": "Mi", "username": "mi", "funcao": "modelo", "regime": "externo", "cargo_detalhado": "Apresentadora & Modelo Gastronômica", "cor": 8, "ativo": true}'::jsonb),
('usr-ju','modelo','{"id": "usr-ju", "nome": "Ju", "username": "ju", "funcao": "modelo", "regime": "externo", "cargo_detalhado": "Apresentadora & Modelo Gastronômica", "cor": 38, "ativo": true}'::jsonb),
('usr-guilherme','interno','{"id": "usr-guilherme", "nome": "Guilherme", "username": "guilherme", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Estrategista & Operações Internas", "cor": 195, "ativo": true}'::jsonb),
('usr-carol','interno','{"id": "usr-carol", "nome": "Carol", "username": "carol", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Editora de Vídeo & Pós-Produção", "cor": 310, "ativo": true}'::jsonb),
('usr-bruna','interno','{"id": "usr-bruna", "nome": "Bruna", "username": "bruna", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Social Media & Copywriter", "cor": 25, "ativo": true}'::jsonb),
('usr-lucas','interno','{"id": "usr-lucas", "nome": "Lucas Verraz", "username": "lucas", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Editor de Vídeo & Colorista", "cor": 180, "ativo": true}'::jsonb),
('usr-evelin','interno','{"id": "usr-evelin", "nome": "Evelin", "username": "evelin", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Designer Gráfica & Criativos", "cor": 290, "ativo": true}'::jsonb),
('usr-juliaint','interno','{"id": "usr-juliaint", "nome": "Julia Int", "username": "juliaint", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Gestora de Tráfego & Performance", "cor": 45, "ativo": true}'::jsonb),
('usr-augusto','interno','{"id": "usr-augusto", "nome": "Augusto", "username": "augusto", "funcao": "interno", "regime": "interno", "cargo_detalhado": "Atendimento & Suporte ao Cliente", "cor": 165, "ativo": true}'::jsonb)
on conflict(employee_id) do nothing;
commit;
