import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Cookie } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { CookieCard, type CookieItem } from "@/components/CookieCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Cookie Shop — Cookies artesanais entregues na sua porta" },
      {
        name: "description",
        content:
          "Catálogo de cookies artesanais com sabores clássicos, especiais e recheados. Peça online com frete rápido.",
      },
    ],
  }),
});

function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["cookies"],
    queryFn: async (): Promise<CookieItem[]> => {
      const { data, error } = await supabase
        .from("cookies")
        .select("id,nome,descricao,preco,categoria,tags,imagem_url")
        .eq("ativo", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c) => ({ ...c, preco: Number(c.preco) }));
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Cookies artesanais, feitos com carinho.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha seus sabores favoritos, monte seu cookie ou assine o Cookie do Mês.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Nossos cookies</h2>
          {error && (
            <p className="text-destructive">Erro ao carregar cookies: {(error as Error).message}</p>
          )}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.map((c) => (
                <CookieCard key={c.id} cookie={c} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum cookie disponível no momento.</p>
          )}
        </section>
      </main>
    </div>
  );
}
