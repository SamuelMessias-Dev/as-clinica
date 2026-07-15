import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyPage({ title, description }: { title: string; description: string }) {
  return <div><h1 className="text-3xl font-semibold">{title}</h1><p className="mt-2 text-muted-foreground">{description}</p><Card className="mt-8"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><Construction className="mb-4 h-10 w-10 text-primary" /><p className="font-medium">Área preparada para a próxima etapa</p><p className="mt-1 text-sm text-muted-foreground">Os recursos desta página serão implementados futuramente.</p></CardContent></Card></div>;
}
