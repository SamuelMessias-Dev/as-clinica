import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bot, Droplet, Flower2, Gem, Leaf, MapPin, MessageCircle, Sparkles, Star, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClinicBySlug } from "@/lib/data/clinics";
import { getProceduresCatalog } from "@/lib/data/procedures";

const catalogIcons = [Gem, WandSparkles, Sparkles, Droplet, Leaf, Flower2, Star, Bot];
const landingPath = "/pg-asclinica";
const whatsappUrl =
  "https://wa.me/5598970094566?text=Ol%C3%A1%2C%20vim%20pelo%20cat%C3%A1logo%20da%20AS%20Est%C3%A9tica%20e%20gostaria%20de%20agendar%20uma%20avalia%C3%A7%C3%A3o.";

export const dynamic = "force-dynamic";

const journey = [
  "Escolha o procedimento",
  "Compartilhe seus dados",
  "Receba a confirmação da clínica",
];

function formatCurrency(value: number | null) {
  if (value == null) return "Sob consulta";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getPriceLabel(procedure: Awaited<ReturnType<typeof getProceduresCatalog>>[number]) {
  const variationPrices = procedure.variations
    .map((variation) => variation.price)
    .filter((price): price is number => price != null);

  if (variationPrices.length > 0) {
    const min = Math.min(...variationPrices);
    const max = Math.max(...variationPrices);
    return min === max ? formatCurrency(min) : `${formatCurrency(min)} a ${formatCurrency(max)}`;
  }

  return formatCurrency(procedure.basePrice);
}

function getDurationLabel(procedure: Awaited<ReturnType<typeof getProceduresCatalog>>[number]) {
  const variationDurations = procedure.variations
    .map((variation) => variation.duration)
    .filter((duration): duration is string => Boolean(duration));

  if (variationDurations.length > 0) {
    const uniqueDurations = Array.from(new Set(variationDurations));
    return uniqueDurations.slice(0, 2).join(" a ");
  }

  return procedure.baseDuration ?? "Sob consulta";
}

export default async function ClinicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);

  if (!clinic) notFound();

  const procedures = await getProceduresCatalog(clinic.id);

  return (
    <main className="min-h-screen bg-[#fdfaf5] text-[#211c18]">
      <header className="sticky top-0 z-40 border-b border-[#e6ded2] bg-[#fdfaf5]/92 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Link href={landingPath} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d7ad2d] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-serif text-2xl tracking-wide">AS Estética</span>
          </Link>

          <nav className="hidden items-center gap-9 text-sm text-[#60564d] md:flex">
            <a href="#catalogo" className="transition hover:text-[#211c18]">Catálogo</a>
            <a href="#clinica" className="transition hover:text-[#211c18]">A Clínica</a>
            <Button className="rounded-full bg-[#d7ad2d] px-6 text-white shadow-[0_12px_28px_rgba(215,173,45,0.22)] hover:bg-[#c79b24]" asChild>
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" />
                Agendar Avaliação
              </a>
            </Button>
          </nav>

          <Button className="rounded-full bg-[#d7ad2d] text-white hover:bg-[#c79b24] md:hidden" asChild>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">Agendar</a>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#e6ded2] bg-[#fdfaf5]">
        <Image
          src="/brand/as-estetica-hero.png"
          alt="Textura visual premium da AS Estética"
          fill
          priority
          className="object-cover object-center opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(253,250,245,0.98)_0%,rgba(253,250,245,0.94)_38%,rgba(253,250,245,0.58)_66%,rgba(253,250,245,0.26)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_42%,rgba(215,173,45,0.12),transparent_34%)]" />

        <div className="relative mx-auto flex min-h-[720px] max-w-6xl items-center px-6 py-20">
          <div className="landing-reveal max-w-4xl">
            <div className="mb-9 flex items-center gap-4">
              <span className="h-px w-12 bg-[#d7ad2d]" />
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#b78d1f]">Estética avançada</p>
            </div>

            <h1 className="max-w-4xl font-serif text-6xl font-normal leading-[0.98] text-[#211c18] sm:text-7xl lg:text-8xl">
              Redefinindo o <span className="italic text-[#837970]">Padrão de</span> Beleza.
            </h1>

            <p className="mt-9 max-w-xl text-lg leading-9 text-[#746b62]">
              Descubra protocolos desenhados para realçar sua essência, combinando cuidado, técnica e um toque de
              arte.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="h-14 rounded-none bg-[#211c18] px-8 text-white hover:bg-[#3c332c]" asChild>
                <a href="#catalogo">Explorar Tratamentos</a>
              </Button>
              <Button
                size="lg"
                className="h-14 rounded-none border border-[#d8d0c4] bg-transparent px-8 text-[#60564d] hover:bg-[#f7f0e8]"
                asChild
              >
                <a href="#clinica">
                  Conhecer a Clínica
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="catalogo" className="border-b border-[#e6ded2] bg-[#fdfaf5] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="landing-reveal">
              <h2 className="font-serif text-5xl font-normal leading-tight text-[#211c18]">Nosso Catálogo</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-[#746b62]">
                Explore procedimentos de alta performance, pensados para cuidado, bem-estar e beleza natural.
              </p>
            </div>

            <div className="landing-reveal flex flex-wrap items-center justify-start gap-3 rounded-full border border-[#e0d8cd] bg-white p-2 shadow-[0_12px_28px_rgba(33,28,24,0.05)] lg:justify-self-end">
              <span className="rounded-full bg-[#d7ad2d] px-8 py-3 text-sm font-medium text-white">Todos</span>
              <span className="px-6 py-3 text-sm text-[#60564d]">Facial</span>
              <span className="px-6 py-3 text-sm text-[#60564d]">Corporal</span>
              <span className="px-6 py-3 text-sm text-[#60564d]">Bem-Estar</span>
            </div>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {procedures.length > 0 ? procedures.map((procedure, index) => {
              const Icon = catalogIcons[index % catalogIcons.length];

              return (
                <article
                  key={procedure.id}
                  className="landing-reveal group flex min-h-[395px] flex-col border border-[#e3dbcf] bg-white p-8 transition duration-500 hover:-translate-y-1 hover:border-[#d7ad2d] hover:shadow-[0_22px_54px_rgba(33,28,24,0.08)]"
                  style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e3dbcf] text-[#9f948a] transition duration-300 group-hover:border-[#d7ad2d] group-hover:text-[#d7ad2d]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-[#d7ad2d]">
                    {procedure.hasVariation ? `${procedure.variations.length} variações` : "Procedimento"}
                  </p>
                  <h3 className="mt-5 font-serif text-2xl font-normal leading-tight text-[#211c18]">{procedure.name}</h3>
                  <p className="mt-5 line-clamp-4 text-sm leading-7 text-[#746b62]">
                    {procedure.description ?? "Procedimento disponível para consulta e agendamento assistido."}
                  </p>

                  <div className="mt-auto border-t border-[#eee8df] pt-6">
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-[#746b62]">Duração média</span>
                        <span className="text-right font-medium text-[#211c18]">{getDurationLabel(procedure)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#746b62]">Investimento</span>
                        <span className="text-right font-medium text-[#211c18]">{getPriceLabel(procedure)}</span>
                      </div>
                    </div>

                    {procedure.variations.length > 0 ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {procedure.variations.slice(0, 3).map((variation) => (
                          <span key={variation.id} className="rounded-full bg-[#f7f0e8] px-3 py-1 text-xs text-[#746b62]">
                            {variation.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            }) : (
              <div className="landing-reveal border border-[#e3dbcf] bg-white p-10 text-center text-[#746b62] md:col-span-2 xl:col-span-3">
                Nenhum procedimento ativo encontrado no catálogo no momento.
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="clinica" className="border-b border-[#e6ded2] bg-[#fdfaf5] py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="landing-reveal">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b78d1f]">A Clínica</p>
            <h2 className="mt-5 font-serif text-5xl font-normal leading-tight text-[#211c18]">
              Cuidado delicado, experiência clara.
            </h2>
          </div>
          <div className="landing-reveal grid gap-3">
            {journey.map((item, index) => (
              <div key={item} className="flex items-center gap-5 border border-[#e3dbcf] bg-white px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1e4c0] text-sm font-medium text-[#9c7218]">
                  {index + 1}
                </span>
                <p className="text-[#60564d]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="localizacao" className="relative overflow-hidden border-b border-[#e6ded2] bg-[#fbf0df] py-20 text-center sm:py-24">
        <div className="absolute left-0 top-0 h-44 w-44 rounded-full border border-[#d7ad2d]/20 opacity-50" />
        <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full border border-[#d7ad2d]/20 opacity-50" />

        <div className="landing-reveal relative mx-auto max-w-2xl px-6">
          <MapPin className="mx-auto h-20 w-20 fill-[#b98536] text-[#b98536]" />
          <h2 className="mt-5 font-serif text-3xl font-normal uppercase tracking-wide text-[#9c7218]">Localização</h2>
          <div className="mx-auto mt-3 h-px w-40 bg-[#d7ad2d]/60" />
          <p className="mt-5 text-lg leading-8 text-[#9c7218]">
            Rua Deputado João Henrique,<br />
            178B, segundo andar,<br />
            Bairro de Fátima.
          </p>

          <div className="mx-auto my-5 h-1 w-1 rounded-full bg-[#d7ad2d]" />

          <h3 className="font-serif text-2xl font-normal uppercase tracking-wide text-[#9c7218]">Dias de funcionamento</h3>
          <div className="mx-auto mt-3 h-px w-40 bg-[#d7ad2d]/60" />
          <div className="mt-5 space-y-5 text-lg leading-8 text-[#9c7218]">
            <p>
              Terça a sexta:<br />
              das 09h00 às 18h00
            </p>
            <p>
              Sábado e domingo:<br />
              das 08h00 às 12h00
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e6ded2] bg-[#fdfaf5] py-24 text-center">
        <div className="landing-reveal mx-auto max-w-3xl px-6">
          <h2 className="font-serif text-5xl font-normal leading-tight text-[#211c18]">
            Pronta para revelar sua melhor versão?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#746b62]">
            Agende uma avaliação e deixe a equipe criar uma orientação pensada para suas necessidades.
          </p>
          <Button size="lg" className="mt-10 h-14 rounded-full bg-[#d7ad2d] px-9 text-white shadow-[0_16px_34px_rgba(215,173,45,0.22)] hover:bg-[#c79b24]" asChild>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" />
              Agendar Avaliação
            </a>
          </Button>
        </div>
      </section>

      <footer className="bg-[#fdfaf5] py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link href={landingPath} className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d7ad2d] text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="font-serif text-xl tracking-wide">AS Estética</span>
            </Link>
            <div className="flex flex-wrap gap-7 text-sm text-[#746b62]">
              <a href="#catalogo">Catálogo</a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer">Contato</a>
              <Link href={`/clinica/${clinic.slug}/agendar`}>Agendamento</Link>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-xs text-[#9f948a] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 AS Estética. Todos os direitos reservados.</p>
            <p>{clinic.address}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
