import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/booking/booking-form";
import { getClinicBySlug, getServicesByClinicId } from "@/lib/data/clinics";

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);

  if (!clinic) notFound();

  const services = await getServicesByClinicId(clinic.id);

  return (
    <main className="min-h-screen bg-[#fdfaf5] text-[#211c18]">
      <header className="border-b border-[#e6ded2] bg-[#fdfaf5]/92 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Link href="/pg-asclinica" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d7ad2d] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-serif text-2xl tracking-wide">AS Estética</span>
          </Link>
          <Button className="rounded-full bg-[#d7ad2d] px-6 text-white hover:bg-[#c79b24]" asChild>
            <Link href="/pg-asclinica">
              <MessageCircle className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b78d1f]">Agendamento</p>
          <h1 className="mt-4 font-serif text-4xl font-normal leading-tight sm:text-5xl">Escolha seu atendimento</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#746b62]">
            Selecione o procedimento, escolha uma data disponível e informe seus dados para a recepção confirmar.
          </p>
        </div>

        <BookingForm clinicId={clinic.id} clinicSlug={clinic.slug} services={services} />
      </section>
    </main>
  );
}
