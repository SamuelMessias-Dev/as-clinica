"use server";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  success: string | null;
};

const initialState: AuthActionState = {
  error: null,
  success: null,
};

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginClinicAction(_state: AuthActionState = initialState, formData: FormData): Promise<AuthActionState> {
  void _state;
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    return { error: "Preencha e-mail e senha para entrar.", success: null };
  }

  if (!hasSupabaseConfig()) {
    return { error: "Supabase não configurado na Vercel. Configure as variáveis de ambiente para liberar o login.", success: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message, success: null };
  }

  redirect("/dashboard");
}

export async function registerClinicAction(_state: AuthActionState = initialState, formData: FormData): Promise<AuthActionState> {
  void _state;
  const clinicName = getFormValue(formData, "clinicName");
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!clinicName || !email || !password) {
    return { error: "Preencha nome da clínica, e-mail e senha.", success: null };
  }

  if (!hasSupabaseConfig()) {
    return { error: "Supabase não configurado na Vercel. Configure as variáveis de ambiente para liberar o cadastro.", success: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        clinic_name: clinicName,
      },
    },
  });

  if (error) {
    return { error: error.message, success: null };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    error: null,
    success: "Cadastro criado. Verifique o e-mail para confirmar o acesso, se necessário.",
  };
}

export async function logoutClinicAction() {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
