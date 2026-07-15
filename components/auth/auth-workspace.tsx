"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Building2, CircleUserRound, LockKeyhole, LogIn, Plus, Shield } from "lucide-react";
import { loginClinicAction, registerClinicAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = {
  error: null,
  success: null,
};

type Mode = "login" | "register";

function StatusMessage({ state }: { state: AuthActionState }) {
  if (state.error) {
    return <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{state.error}</div>;
  }

  if (state.success) {
    return <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</div>;
  }

  return null;
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function AuthWorkspace() {
  const [mode, setMode] = useState<Mode>("login");
  const [loginState, loginAction, loginPending] = useActionState(loginClinicAction, initialState);
  const [registerState, registerAction, registerPending] = useActionState(registerClinicAction, initialState);

  const isLogin = mode === "login";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_45%,#e8f1ff_100%)]">
      <div className="absolute inset-x-0 top-0 h-28 border-b border-white/70 bg-white/70 backdrop-blur-sm" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur">
              <Shield className="h-3.5 w-3.5" />
              Acesso da clínica
            </p>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {isLogin ? "Entrar no painel" : "Cadastrar clínica"}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
              {isLogin
                ? "Use seu e-mail e senha para acessar o painel administrativo da clínica."
                : "Crie o acesso inicial com nome da clínica, e-mail e senha."}
            </p>
          </div>

          <Card className="border-white/70 bg-white/90 shadow-[0_24px_90px_rgba(37,99,235,0.16)] backdrop-blur">
            <CardHeader className="space-y-4 p-5 sm:p-6">
              <div className="flex rounded-full bg-muted p-1">
                <ModeButton active={isLogin} onClick={() => setMode("login")}>
                  Entrar
                </ModeButton>
                <ModeButton active={!isLogin} onClick={() => setMode("register")}>
                  Cadastrar
                </ModeButton>
              </div>

              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  {isLogin ? <LogIn className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                  {isLogin ? "Login" : "Cadastro da clínica"}
                </CardTitle>
                <CardDescription>
                  {isLogin
                    ? "Entrar com e-mail e senha."
                    : "Nome da clínica, e-mail e senha para liberar o acesso interno."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
              {isLogin ? (
                <form action={loginAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input id="login-email" name="email" type="email" placeholder="voce@clinica.com" className="h-11 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input id="login-password" name="password" type="password" className="h-11 bg-white" />
                  </div>
                  <Button className="w-full gap-2" type="submit" disabled={loginPending}>
                    <LogIn className="h-4 w-4" />
                    {loginPending ? "Entrando..." : "Entrar"}
                  </Button>
                  <StatusMessage state={loginState} />
                </form>
              ) : (
                <form action={registerAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-clinic-name">Nome da clínica</Label>
                    <Input id="register-clinic-name" name="clinicName" placeholder="AS Estética" className="h-11 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-mail</Label>
                    <Input id="register-email" name="email" type="email" placeholder="contato@asestetica.com.br" className="h-11 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <Input id="register-password" name="password" type="password" className="h-11 bg-white" />
                  </div>
                  <Button className="w-full gap-2" type="submit" disabled={registerPending}>
                    <Building2 className="h-4 w-4" />
                    {registerPending ? "Criando acesso..." : "Cadastrar clínica"}
                  </Button>
                  <StatusMessage state={registerState} />
                  <p className="text-xs leading-5 text-muted-foreground">
                    A conta criada aqui é apenas para acesso interno da clínica.
                  </p>
                </form>
              )}

              <div className="grid gap-2 pt-2 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                  <span className="mb-1 flex items-center gap-2 font-medium text-foreground">
                    <CircleUserRound className="h-4 w-4 text-primary" />
                    Acesso simples
                  </span>
                  E-mail e senha para a equipe da clínica.
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                  <span className="mb-1 flex items-center gap-2 font-medium text-foreground">
                    <LockKeyhole className="h-4 w-4 text-primary" />
                    Direto ao painel
                  </span>
                  Ao entrar, o acesso vai para o dashboard administrativo.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
