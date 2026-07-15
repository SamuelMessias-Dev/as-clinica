# Negócio Clínica

Base de um sistema multi-clínica de agendamentos para clínicas de estética.

## Começando

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env.local` e preencha a URL e a publishable key do Supabase.
3. Execute `npm run dev`.

As páginas públicas de clínica e serviços tentam carregar dados do Supabase quando `.env.local` está configurado; sem as variáveis, seguem usando dados mockados. Indicadores internos, conversas, disponibilidade e criação de agendamentos ainda usam dados demonstrativos. Entidades pertencentes a uma clínica carregam o campo `clinic_id`.
