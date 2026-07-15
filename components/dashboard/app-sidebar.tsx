"use client";

import { CalendarDays, CalendarRange, LayoutDashboard, LockKeyhole, MessageCircle, PanelLeftClose, PanelLeftOpen, Settings, Sparkles, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/conversas", label: "Conversas", icon: MessageCircle, locked: true },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarRange },
  { href: "/dashboard/agendamentos", label: "Agendamentos", icon: CalendarDays },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/servicos", label: "Serviços", icon: Sparkles },
  { href: "/dashboard/profissionais", label: "Profissionais", icon: Stethoscope },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("dashboard-sidebar-collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("dashboard-sidebar-collapsed", String(collapsed));
  }, [collapsed, hydrated]);

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <aside
        className={cn(
          "hidden border-r bg-white transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col",
          collapsed ? "lg:w-20" : "lg:w-64",
        )}
      >
        <div className={cn("flex items-start justify-between gap-3 border-b p-4", collapsed && "justify-center px-3")}>
          <div className={cn("min-w-0", collapsed && "hidden")}>
            <p className="font-semibold">AS Estética</p>
            <p className="text-xs text-muted-foreground">Painel administrativo</p>
          </div>
          <button
            type="button"
            aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            onClick={() => setCollapsed((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <nav className={cn("flex flex-1 flex-col gap-1 p-3", collapsed && "items-center")}>
          {items.map(({ href, label, icon: Icon, locked }) =>
            locked ? (
              <button
                key={href}
                type="button"
                aria-disabled="true"
                title="Em breve"
                className={cn(
                  "flex min-h-11 cursor-not-allowed items-center rounded-md text-sm font-medium text-muted-foreground opacity-70 transition-colors",
                  collapsed ? "w-11 justify-center px-0" : "gap-3 px-3",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className={cn("truncate", collapsed && "hidden")}>{label}</span>
                {locked && !collapsed ? <LockKeyhole className="ml-auto h-3.5 w-3.5 text-muted-foreground" /> : null}
              </button>
            ) : (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  collapsed ? "w-11 justify-center px-0" : "gap-3 px-3",
                  isActive(href) && "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className={cn("truncate", collapsed && "hidden")}>{label}</span>
              </Link>
            ),
          )}
        </nav>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 py-2">
          {items.slice(0, 5).map(({ href, label, icon: Icon, locked }) =>
            locked ? (
              <button
                key={href}
                type="button"
                aria-disabled="true"
                title="Em breve"
                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground opacity-70"
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  <LockKeyhole className="absolute -right-2 -top-1 h-3 w-3 rounded-full bg-white text-muted-foreground" />
                </span>
                <span className="max-w-full truncate">{label}</span>
              </button>
            ) : (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive(href) && "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            ),
          )}
        </div>
      </nav>
    </>
  );
}
