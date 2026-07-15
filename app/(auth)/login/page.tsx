import { redirect } from "next/navigation";
import { AuthWorkspace } from "@/components/auth/auth-workspace";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return <AuthWorkspace />;
}
