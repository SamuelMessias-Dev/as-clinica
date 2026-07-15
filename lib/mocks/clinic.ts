import type { Clinic } from "@/lib/types/database";

export const mockClinics: Clinic[] = [
  {
    id: "clinic_demo_001",
    slug: "clinica-bela",
    name: "AS Estética",
    description: "Cuidado, bem-estar e estética em um só lugar.",
    address: "Rua Deputado João Henrique, 178B, segundo andar, Bairro de Fátima",
    phone: "(85) 99999-0000",
  },
];

export function getMockClinicBySlug(slug: string) {
  return mockClinics.find((clinic) => clinic.slug === slug);
}
