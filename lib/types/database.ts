export type Clinic = {
  id: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  phone: string;
};

export type Service = {
  id: string;
  clinic_id: string;
  name: string;
  duration_minutes: number;
  price_in_cents: number;
  description?: string | null;
  duration_label?: string | null;
  variation_id?: string | null;
};

export type Appointment = {
  id: string;
  clinic_id: string;
  service_id: string;
  professional_id: string;
  customer_name: string;
  starts_at: string;
};

export type Lead = {
  id: number;
  created_at: string;
  nome: string | null;
  numero_celular: string | null;
  email: string | null;
  descricao: string | null;
  ultimo_contato: string | null;
  foto_url: string | null;
};

export type DadosLead = {
  id: number;
  created_at: string;
  lead: number | null;
  descricao_conversa: string | null;
  ultima_conversa: boolean | null;
  tipo: string | null;
  mensagem: string | null;
};

export type Procedimento = {
  id: number;
  created_at: string;
  nome: string | null;
  descricao: string | null;
  possui_variacao: boolean | null;
  ativo: boolean | null;
  valor: number | null;
  duracao: string | null;
};

export type ProcedimentoVariacao = {
  id: number;
  created_at: string;
  procedimento_id: number | null;
  nome: string | null;
  duracao: string | null;
  valor: number | null;
  exemplos: string | null;
};

export type Agendamento = {
  id: number;
  created_at: string;
  lead: number | null;
  procedimento: number | null;
  variacao_procedimento: number | null;
  data: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  profissional_id: number | null;
  status: string | null;
  observacoes: string | null;
  valor_final: number | null;
  origem: string | null;
  cliente_nome_snapshot: string | null;
  cliente_celular_snapshot: string | null;
  profissional_nome_snapshot: string | null;
  procedimento_nome_snapshot: string | null;
  variacao_nome_snapshot: string | null;
};

export type Profissional = {
  id: number;
  created_at: string;
  nome: string | null;
  celular: string | null;
  email: string | null;
  descricao: string | null;
  foto_url: string | null;
  agenda_inicio: string | null;
  agenda_fim: string | null;
  agenda_pausa_inicio: string | null;
  agenda_pausa_fim: string | null;
  agenda_dias_semana: number[] | null;
};

export type UserProfile = {
  user_id: string;
  clinic_name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      agendamento: Table<Agendamento>;
      dados_leads: Table<DadosLead>;
      lead_procedimentos: Table<{
        id: number;
        created_at: string;
        lead_id: number | null;
        procedimento_id: number | null;
      }>;
      leads: Table<Lead>;
      profissionais: Table<Profissional>;
      user_profiles: Table<UserProfile>;
      procedimento_variacao: Table<ProcedimentoVariacao>;
      procedimentos: Table<Procedimento>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
