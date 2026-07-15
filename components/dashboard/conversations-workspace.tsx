"use client";

import { Bot, CalendarPlus, CheckCircle2, MessageCircle, PauseCircle, PlayCircle, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { AppointmentModal } from "@/components/dashboard/appointment-modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CustomerProfile } from "@/lib/data/customers";
import type { ProfessionalProfile } from "@/lib/data/professionals";
import type { ProcedureCatalogItem } from "@/lib/data/procedures";
import { cn } from "@/lib/utils";
import { dashboardConversations, type ConversationStatus, type DashboardConversation } from "@/lib/mocks/dashboard";

const statusLabels: Record<ConversationStatus, string> = {
  ia_ativa: "IA ativa",
  aguardando_humano: "Aguardando humano",
  humano_assumiu: "Humano assumiu",
  agendado: "Agendado",
};

const statusClasses: Record<ConversationStatus, string> = {
  ia_ativa: "border-sky-200 bg-sky-50 text-sky-700",
  aguardando_humano: "border-amber-200 bg-amber-50 text-amber-700",
  humano_assumiu: "border-primary/20 bg-primary/10 text-primary",
  agendado: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const filters: Array<{ value: "todos" | ConversationStatus; label: string }> = [
  { value: "todos", label: "Todas" },
  { value: "aguardando_humano", label: "Aguardando" },
  { value: "humano_assumiu", label: "Assumidas" },
  { value: "ia_ativa", label: "IA ativa" },
  { value: "agendado", label: "Agendadas" },
];

function ConversationBadge({ status }: { status: ConversationStatus }) {
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", statusClasses[status])}>{statusLabels[status]}</span>;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function ConversationsWorkspace({
  customers = [],
  professionalOptions = [],
  procedures = [],
}: {
  customers?: CustomerProfile[];
  professionalOptions?: ProfessionalProfile[];
  procedures?: ProcedureCatalogItem[];
}) {
  const [selectedId, setSelectedId] = useState(dashboardConversations[0]?.id);
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("todos");
  const [localStates, setLocalStates] = useState<Record<string, { status: ConversationStatus; aiEnabled: boolean }>>({});
  const [modalState, setModalState] = useState<{ open: boolean; conversation?: DashboardConversation }>({ open: false });

  const conversations = useMemo(() => dashboardConversations.map((conversation) => ({
    ...conversation,
    ...localStates[conversation.id],
  })), [localStates]);

  const filteredConversations = conversations.filter((conversation) => filter === "todos" || conversation.status === filter);
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];

  const selectedCustomer = selectedConversation
    ? customers.find(
        (customer) =>
          onlyDigits(customer.cellphone) === onlyDigits(selectedConversation.phone) ||
          normalizeText(customer.name) === normalizeText(selectedConversation.customer),
      )
    : undefined;

  const selectedProcedureId = selectedConversation
    ? procedures.find((procedure) => {
        const interest = normalizeText(selectedConversation.interest);
        const procedureName = normalizeText(procedure.name);
        return procedureName.includes(interest) || interest.includes(procedureName);
      })?.id
    : undefined;

  function updateConversation(id: string, state: { status: ConversationStatus; aiEnabled: boolean }) {
    setLocalStates((current) => ({ ...current, [id]: state }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversas"
        description="A IA faz a triagem. Valores, datas disponíveis e agendamentos ficam sob controle humano."
        actions={
          <Button className="w-full gap-2 sm:w-auto">
            <MessageCircle className="h-4 w-4" />
            Nova conversa
          </Button>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "shrink-0 rounded-full border bg-white px-3 py-2 text-sm font-medium text-muted-foreground",
              filter === item.value && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr_320px]">
        <div className="space-y-3">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setSelectedId(conversation.id)}
              className={cn(
                "w-full rounded-lg border bg-white p-4 text-left hover:bg-muted/50",
                selectedConversation?.id === conversation.id && "border-primary",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{conversation.customer}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{conversation.phone}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{conversation.lastMessageAt}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ConversationBadge status={conversation.status} />
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", conversation.aiEnabled ? "bg-sky-50 text-sky-700" : "bg-muted text-muted-foreground")}>
                  {conversation.aiEnabled ? "IA ligada" : "IA pausada"}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{conversation.lastMessage}</p>
            </button>
          ))}
        </div>

        <Card className="min-h-[560px]">
          {selectedConversation ? (
            <CardContent className="flex h-full flex-col p-0">
              <div className="border-b p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedConversation.customer}</h2>
                    <p className="text-sm text-muted-foreground">{selectedConversation.interest}</p>
                  </div>
                  <ConversationBadge status={selectedConversation.status} />
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[88%] rounded-lg border bg-white p-3 text-sm shadow-sm",
                      message.sender === "cliente" && "mr-auto",
                      message.sender !== "cliente" && "ml-auto",
                      message.sender === "ia" && "border-sky-100 bg-sky-50",
                      message.sender === "humano" && "border-primary/20 bg-primary/10",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
                      <span>{message.sender === "cliente" ? "Cliente" : message.sender === "ia" ? "IA" : "Humano"}</span>
                      <span>{message.time}</span>
                    </div>
                    <p className="leading-6">{message.text}</p>
                  </div>
                ))}
              </div>

              <div className="border-t bg-white p-4">
                <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Preços, pacotes, datas disponíveis e criação de agendamento devem ser feitos por humano nesta etapa.
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => updateConversation(selectedConversation.id, { status: "humano_assumiu", aiEnabled: false })}
                  >
                    <UserCheck className="h-4 w-4" />
                    Assumir conversa
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    variant="outline"
                    onClick={() => setModalState({ open: true, conversation: selectedConversation })}
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Criar agendamento
                  </Button>
                </div>
              </div>
            </CardContent>
          ) : null}
        </Card>

        {selectedConversation ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div>
                  <p className="text-sm font-semibold">Controle da IA</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedConversation.aiEnabled ? "A IA pode responder mensagens gerais." : "A IA não envia mensagens automáticas."}</p>
                </div>
                <div className="grid gap-2">
                  <Button
                    className="gap-2"
                    variant={selectedConversation.aiEnabled ? "outline" : "default"}
                    onClick={() => updateConversation(selectedConversation.id, { status: "humano_assumiu", aiEnabled: false })}
                  >
                    <PauseCircle className="h-4 w-4" />
                    Pausar IA
                  </Button>
                  <Button
                    className="gap-2"
                    variant="outline"
                    onClick={() => updateConversation(selectedConversation.id, { status: "ia_ativa", aiEnabled: true })}
                  >
                    <PlayCircle className="h-4 w-4" />
                    Reativar IA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Resumo da triagem</p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{selectedConversation.summary}</p>
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Interesse</p>
                  <p className="mt-1 font-medium">{selectedConversation.interest}</p>
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="mt-1 font-medium">{selectedConversation.phone}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-semibold">Regra inicial</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">A IA coleta informações. O humano informa preço, verifica disponibilidade e salva o agendamento.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      <AppointmentModal
        open={modalState.open}
        mode="create"
        onClose={() => setModalState({ open: false })}
        initialCustomerId={selectedCustomer ? String(selectedCustomer.id) : undefined}
        initialProfessionalId={professionalOptions[0] ? String(professionalOptions[0].id) : undefined}
        initialProcedureId={selectedProcedureId ? String(selectedProcedureId) : undefined}
        customers={customers}
        professionals={professionalOptions}
        procedures={procedures}
      />
    </div>
  );
}
