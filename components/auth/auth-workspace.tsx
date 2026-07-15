"use client";

import Image from "next/image";
import { useActionState, useState, type ReactNode } from "react";
import { ArrowRight, Building2, Sparkles } from "lucide-react";
import { loginClinicAction, registerClinicAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
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
    return <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>;
  }

  if (state.success) {
    return <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.success}</div>;
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
        "font-medium transition-colors",
        active ? "text-[#211c18]" : "text-[#a1978d] hover:text-[#211c18]",
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
    <main className="grid min-h-screen bg-[#fdfaf5] text-[#211c18] lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-[#e6ded2] lg:block">
        <Image
          src="/brand/as-estetica-hero.png"
          alt="Ambiente visual da AS Estética"
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-[#fdfaf5]/48" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(253,250,245,0.72)_0%,rgba(253,250,245,0.46)_52%,rgba(253,250,245,0.78)_100%)]" />

        <div className="absolute left-16 top-16 flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d7ad2d] text-white shadow-[0_16px_34px_rgba(215,173,45,0.26)]">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="font-serif text-3xl tracking-wide">AS Estética</span>
        </div>

        <div className="absolute bottom-20 left-16 max-w-2xl">
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-12 bg-[#d7ad2d]" />
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#b78d1f]">Estética e SPA</p>
          </div>
          <h1 className="font-serif text-7xl font-normal leading-[0.98] text-[#211c18]">
            Redefinindo o <span className="italic text-[#837970]">Padrão de</span> Beleza.
          </h1>
          <p className="mt-8 max-w-lg text-xl leading-9 text-[#746b62]">
            Gerencie sua clínica com clareza, cuidado e uma experiência elegante para a equipe.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
        <div className="w-full max-w-xl">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d7ad2d] text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="font-serif text-3xl tracking-wide">AS Estética</span>
          </div>

          <div>
            <h2 className="font-serif text-5xl font-normal leading-tight text-[#211c18]">
              {isLogin ? "Acesse sua conta" : "Cadastre sua clínica"}
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#8b8178]">
              {isLogin
                ? "Insira suas credenciais para gerenciar seus agendamentos."
                : "Crie o acesso administrativo para começar a organizar a operação."}
            </p>
          </div>

          {isLogin ? (
            <form action={loginAction} className="mt-12 space-y-7">
              <div className="space-y-3">
                <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-[0.22em] text-[#8b8178]">
                  E-mail
                </Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="h-16 rounded-none border-[#e4ddd2] bg-transparent px-5 text-base placeholder:text-[#c8c0b7] focus:ring-[#d7ad2d]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-[0.22em] text-[#8b8178]">
                    Senha
                  </Label>
                  <button type="button" className="text-xs font-bold uppercase tracking-[0.2em] text-[#d7ad2d]">
                    Esqueceu a senha?
                  </button>
                </div>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  className="h-16 rounded-none border-[#e4ddd2] bg-transparent px-5 text-base placeholder:text-[#c8c0b7] focus:ring-[#d7ad2d]"
                />
              </div>

              <Button
                className="h-16 w-full rounded-none bg-[#d7ad2d] text-sm font-bold uppercase tracking-[0.22em] text-white hover:bg-[#c79b24]"
                type="submit"
                disabled={loginPending}
              >
                {loginPending ? "Entrando..." : "Entrar"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <StatusMessage state={loginState} />
            </form>
          ) : (
            <form action={registerAction} className="mt-12 space-y-7">
              <div className="space-y-3">
                <Label htmlFor="register-clinic-name" className="text-xs font-bold uppercase tracking-[0.22em] text-[#8b8178]">
                  Nome da clínica
                </Label>
                <Input
                  id="register-clinic-name"
                  name="clinicName"
                  placeholder="AS Estética"
                  className="h-16 rounded-none border-[#e4ddd2] bg-transparent px-5 text-base placeholder:text-[#c8c0b7] focus:ring-[#d7ad2d]"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="register-email" className="text-xs font-bold uppercase tracking-[0.22em] text-[#8b8178]">
                  E-mail
                </Label>
                <Input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="contato@asestetica.com.br"
                  className="h-16 rounded-none border-[#e4ddd2] bg-transparent px-5 text-base placeholder:text-[#c8c0b7] focus:ring-[#d7ad2d]"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="register-password" className="text-xs font-bold uppercase tracking-[0.22em] text-[#8b8178]">
                  Senha
                </Label>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  className="h-16 rounded-none border-[#e4ddd2] bg-transparent px-5 text-base placeholder:text-[#c8c0b7] focus:ring-[#d7ad2d]"
                />
              </div>

              <Button
                className="h-16 w-full rounded-none bg-[#d7ad2d] text-sm font-bold uppercase tracking-[0.22em] text-white hover:bg-[#c79b24]"
                type="submit"
                disabled={registerPending}
              >
                {registerPending ? "Criando..." : "Cadastrar"}
                <Building2 className="h-4 w-4" />
              </Button>
              <StatusMessage state={registerState} />
            </form>
          )}

          <div className="mt-12 border-t border-[#e6ded2] pt-8 text-center text-base text-[#8b8178]">
            {isLogin ? "Ainda não tem uma conta? " : "Já tem uma conta? "}
            <ModeButton active={false} onClick={() => setMode(isLogin ? "register" : "login")}>
              {isLogin ? "Cadastre-se" : "Entrar"}
            </ModeButton>
          </div>
        </div>
      </section>
    </main>
  );
}
