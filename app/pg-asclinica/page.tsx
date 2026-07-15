import ClinicPage from "@/app/(public)/clinica/[slug]/page";

export default function AsClinicaPage() {
  return <ClinicPage params={Promise.resolve({ slug: "clinica-bela" })} />;
}
