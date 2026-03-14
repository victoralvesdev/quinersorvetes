import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Em breve — Quiner Sorvetes",
  description: "Nossa inauguração está chegando! Dia 16 de março, segunda-feira.",
};

export default function InauguracaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
