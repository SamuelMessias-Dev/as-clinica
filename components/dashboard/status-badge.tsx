import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/mocks/dashboard";

const statusLabels: Record<AppointmentStatus, string> = {
  confirmado: "Confirmado",
  aguardando: "Aguardando",
  concluido: "Concluido",
  cancelado: "Cancelado",
};

const statusClasses: Record<AppointmentStatus, string> = {
  confirmado: "border-emerald-200 bg-emerald-50 text-emerald-700",
  aguardando: "border-amber-200 bg-amber-50 text-amber-700",
  concluido: "border-slate-200 bg-slate-50 text-slate-600",
  cancelado: "border-red-200 bg-red-50 text-red-700",
};

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", statusClasses[status], className)}>
      {statusLabels[status]}
    </span>
  );
}

