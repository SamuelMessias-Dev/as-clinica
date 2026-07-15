import { redirect } from "next/navigation";
import { AuthWorkspace } from "@/components/auth/auth-workspace";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (!hasSupabaseConfig()) {
    return <AuthWorkspace />;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return <AuthWorkspace />;
}
