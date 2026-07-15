import Link from "next/link";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutClinicAction } from "@/lib/actions/auth";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase text-muted-foreground">Clínica atual</p>
          <p className="truncate text-sm font-semibold text-foreground sm:text-base">AS Estética</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild className="hidden gap-2 sm:inline-flex" size="sm">
            <Link href="/dashboard/agendamentos">
              <Plus className="h-4 w-4" />
              Agendar
            </Link>
          </Button>
          <form action={logoutClinicAction}>
            <Button aria-label="Sair" variant="outline" size="sm" className="h-9 w-9 px-0 sm:w-auto sm:px-3">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
