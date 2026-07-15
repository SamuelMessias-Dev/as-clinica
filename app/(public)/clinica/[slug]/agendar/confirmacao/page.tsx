import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClinicBySlug } from "@/lib/data/clinics";

export default async function ConfirmationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await getClinicBySlug(slug))) notFound();

  return <main className="container flex min-h-screen items-center justify-center"><Card className="max-w-md text-center"><CardHeader><CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-primary" /><CardTitle>Agendamento recebido</CardTitle></CardHeader><CardContent className="space-y-6"><p className="text-muted-foreground">Esta é uma confirmação demonstrativa. A integração com o Supabase será conectada na próxima etapa.</p><Button variant="outline" asChild><Link href="/pg-asclinica">Voltar para a clínica</Link></Button></CardContent></Card></main>;
}
