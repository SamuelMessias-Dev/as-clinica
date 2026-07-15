import { mockServices } from "@/lib/mocks/services";

export type AppointmentStatus = "confirmado" | "aguardando" | "concluido" | "cancelado";

export type DashboardAppointment = {
  id: string;
  date: string;
  time: string;
  customer: string;
  phone: string;
  service: string;
  professional: string;
  status: AppointmentStatus;
  notes?: string;
};

export type ConversationStatus = "ia_ativa" | "aguardando_humano" | "humano_assumiu" | "agendado";

export type ConversationMessage = {
  id: string;
  sender: "cliente" | "ia" | "humano";
  text: string;
  time: string;
};

export type DashboardConversation = {
  id: string;
  customer: string;
  phone: string;
  interest: string;
  status: ConversationStatus;
  aiEnabled: boolean;
  lastMessage: string;
  lastMessageAt: string;
  summary: string;
  messages: ConversationMessage[];
};

export type DashboardCustomer = {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  nextVisit?: string;
};

export type DashboardProfessional = {
  id: string;
  name: string;
  role: string;
  nextAvailable: string;
  todayAppointments: number;
};

export const dashboardAppointments: DashboardAppointment[] = [
  {
    id: "appt_1",
    date: "2026-07-10",
    time: "09:00",
    customer: "Marina Costa",
    phone: "(85) 98812-3400",
    service: "Limpeza de pele",
    professional: "Dra. Larissa",
    status: "confirmado",
  },
  {
    id: "appt_2",
    date: "2026-07-10",
    time: "10:30",
    customer: "Renata Alves",
    phone: "(85) 99745-8801",
    service: "Drenagem linfática",
    professional: "Camila Rocha",
    status: "aguardando",
    notes: "Primeira visita",
  },
  {
    id: "appt_3",
    date: "2026-07-10",
    time: "14:00",
    customer: "Beatriz Lima",
    phone: "(85) 99210-6614",
    service: "Massagem relaxante",
    professional: "Camila Rocha",
    status: "confirmado",
  },
  {
    id: "appt_4",
    date: "2026-07-10",
    time: "16:00",
    customer: "Sofia Martins",
    phone: "(85) 98122-1099",
    service: "Limpeza de pele",
    professional: "Dra. Larissa",
    status: "confirmado",
  },
  {
    id: "appt_5",
    date: "2026-07-11",
    time: "11:00",
    customer: "Livia Pereira",
    phone: "(85) 98900-2211",
    service: "Drenagem linfática",
    professional: "Camila Rocha",
    status: "confirmado",
  },
  {
    id: "appt_6",
    date: "2026-07-14",
    time: "15:30",
    customer: "Juliana Paiva",
    phone: "(85) 99631-4409",
    service: "Limpeza de pele",
    professional: "Dra. Larissa",
    status: "aguardando",
  },
];

export const dashboardCustomers: DashboardCustomer[] = [
  { id: "customer_1", name: "Marina Costa", phone: "(85) 98812-3400", lastVisit: "Hoje", nextVisit: "09:00" },
  { id: "customer_2", name: "Renata Alves", phone: "(85) 99745-8801", lastVisit: "12 jun", nextVisit: "10:30" },
  { id: "customer_3", name: "Beatriz Lima", phone: "(85) 99210-6614", lastVisit: "28 jun", nextVisit: "14:00" },
  { id: "customer_4", name: "Sofia Martins", phone: "(85) 98122-1099", lastVisit: "03 jul", nextVisit: "16:00" },
];

export const dashboardProfessionals: DashboardProfessional[] = [
  { id: "professional_1", name: "Dra. Larissa", role: "Esteticista", nextAvailable: "11:30", todayAppointments: 2 },
  { id: "professional_2", name: "Camila Rocha", role: "Massoterapeuta", nextAvailable: "15:00", todayAppointments: 2 },
  { id: "professional_3", name: "Paula Nogueira", role: "Recepção", nextAvailable: "Agora", todayAppointments: 0 },
];

export const dashboardServices = mockServices.map((service) => ({
  ...service,
  bookingsToday: service.id === "service_1" ? 2 : 1,
}));

export const dashboardConversations: DashboardConversation[] = [
  {
    id: "conversation_1",
    customer: "Ana Ribeiro",
    phone: "(85) 98777-4500",
    interest: "Pacote de limpeza de pele",
    status: "aguardando_humano",
    aiEnabled: false,
    lastMessage: "Queria saber os valores e se tem pacote.",
    lastMessageAt: "08:42",
    summary: "Cliente perguntou sobre valores e pacote. IA pausou para atendimento humano.",
    messages: [
      { id: "m1", sender: "cliente", text: "Oi, queria saber sobre limpeza de pele.", time: "08:35" },
      { id: "m2", sender: "ia", text: "Claro. Posso te explicar como funciona o procedimento e encaminhar para a equipe sobre valores.", time: "08:36" },
      { id: "m3", sender: "cliente", text: "Queria saber os valores e se tem pacote.", time: "08:42" },
    ],
  },
  {
    id: "conversation_2",
    customer: "Carla Menezes",
    phone: "(85) 99120-3322",
    interest: "Drenagem linfática",
    status: "humano_assumiu",
    aiEnabled: false,
    lastMessage: "Pode ser na próxima semana?",
    lastMessageAt: "09:10",
    summary: "Humano assumiu para conferir datas e preço antes de agendar.",
    messages: [
      { id: "m4", sender: "cliente", text: "Tenho interesse em drenagem.", time: "09:01" },
      { id: "m5", sender: "ia", text: "A drenagem pode auxiliar na sensação de retenção. Vou chamar a equipe para valores e horários.", time: "09:02" },
      { id: "m6", sender: "humano", text: "Oi, Carla. Vou verificar os horários disponíveis para você.", time: "09:08" },
      { id: "m7", sender: "cliente", text: "Pode ser na próxima semana?", time: "09:10" },
    ],
  },
  {
    id: "conversation_3",
    customer: "Fernanda Sales",
    phone: "(85) 98444-1020",
    interest: "Massagem relaxante",
    status: "ia_ativa",
    aiEnabled: true,
    lastMessage: "Tem algum preparo antes?",
    lastMessageAt: "10:15",
    summary: "IA ainda pode responder perguntas gerais. Sem preço ou agenda solicitados.",
    messages: [
      { id: "m8", sender: "cliente", text: "Massagem relaxante demora quanto tempo?", time: "10:12" },
      { id: "m9", sender: "ia", text: "A sessão costuma durar cerca de 50 minutos.", time: "10:13" },
      { id: "m10", sender: "cliente", text: "Tem algum preparo antes?", time: "10:15" },
    ],
  },
  {
    id: "conversation_4",
    customer: "Patricia Nunes",
    phone: "(85) 98211-8800",
    interest: "Retorno",
    status: "agendado",
    aiEnabled: true,
    lastMessage: "Obrigada, confirmado.",
    lastMessageAt: "Ontem",
    summary: "Agendamento criado pelo humano. IA liberada para lembretes operacionais.",
    messages: [
      { id: "m11", sender: "humano", text: "Seu retorno ficou para hoje as 16:00.", time: "Ontem" },
      { id: "m12", sender: "cliente", text: "Obrigada, confirmado.", time: "Ontem" },
    ],
  },
];
