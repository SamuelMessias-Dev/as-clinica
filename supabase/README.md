# Supabase

Este diretório guarda os artefatos versionados do Supabase.

- `migrations/`: migrations SQL do banco para acompanhar mudanças de schema e storage.

## Cadastro de profissionais

Para a tela de profissionais funcionar com foto, aplique a migration:

- `supabase/migrations/20260710_add_profissionais_photo_url.sql`

Ela faz três coisas:

1. adiciona a coluna `foto_url` em `public.profissionais`
2. cria o bucket público `profissionais`
3. libera policies básicas para leitura e upload das imagens

Observação: as policies de storage estão abertas o suficiente para a fase atual do projeto. Quando a autenticação entrar, vale restringir o acesso por usuário/role.

Para salvar a jornada de atendimento do profissional, aplique também:

- `supabase/migrations/20260713_add_profissionais_agenda.sql`

Ela adiciona os campos de início, fim, pausa e dias ativos em `public.profissionais`.

## Cadastro de clientes

Para a tela de clientes funcionar com foto, aplique a migration:

- `supabase/migrations/20260713_add_leads_photo_url.sql`

Ela adiciona `email`, `descricao` e `foto_url` em `public.leads` e cria o bucket público `clientes`.

## Base da agenda

Para a agenda usar os campos mínimos de operação, aplique:

- `supabase/migrations/20260713_add_agendamento_foundation.sql`

Ela adiciona ao `public.agendamento` os campos de horário, status, valor final, observações, profissional e snapshots para histórico.

## Perfis de autenticação

Para criar a referência pública dos usuários autenticados do Supabase, aplique:

- `supabase/migrations/20260715_add_auth_user_profiles.sql`

Ela cria a tabela `public.user_profiles`, vincula cada linha ao `auth.users(id)` e preenche automaticamente o perfil quando uma nova conta é criada.
