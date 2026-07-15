import type { Service } from "@/lib/types/database";

export const mockServices: Service[] = [
  { id: "service_1", clinic_id: "clinic_demo_001", name: "Limpeza de pele", duration_minutes: 60, price_in_cents: 15000 },
  { id: "service_2", clinic_id: "clinic_demo_001", name: "Massagem relaxante", duration_minutes: 50, price_in_cents: 18000 },
  { id: "service_3", clinic_id: "clinic_demo_001", name: "Drenagem linfática", duration_minutes: 60, price_in_cents: 20000 },
];

export function getMockServicesByClinicId(clinicId: string) {
  return mockServices.filter((service) => service.clinic_id === clinicId);
}
