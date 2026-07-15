import ClinicPage from "@/app/(public)/clinica/[slug]/page";

export const dynamic = "force-dynamic";

export default function AsClinicaPage() {
  return <ClinicPage params={Promise.resolve({ slug: "clinica-bela" })} />;
}
