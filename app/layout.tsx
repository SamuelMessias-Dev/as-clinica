import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AS Estética", template: "%s | AS Estética" },
  description: "Agendamento online para clínicas de estética.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
