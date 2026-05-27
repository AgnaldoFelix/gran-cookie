import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Cookie, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { CookieCard, type CookieItem } from "@/components/CookieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import heroBanner from "@/assets/hero-banner.jpg";
import imgChocoChunks from "@/assets/cookie-choco-chunks.jpg";
import imgRedVelvet from "@/assets/cookie-red-velvet.jpg";
import imgAveiaMel from "@/assets/cookie-aveia-mel.jpg";
import imgDoceLeite from "@/assets/cookie-doce-leite.jpg";

const MOCK_IMAGES: Record<string, string> = {
  "Choco Chunks": imgChocoChunks,
  "Red Velvet": imgRedVelvet,
  "Aveia & Mel": imgAveiaMel,
  "Doce de Leite": imgDoceLeite,
};

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "GranCookie — Cookies artesanais entregues na sua porta" },
      {
        name: "description",
        content:
          "Catálogo de cookies artesanais com sabores clássicos, especiais e recheados. Peça online com frete rápido.",
      },
    ],
  }),
});

function Home() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["cookies"],
    queryFn: async (): Promise<CookieItem[]> => {
      const { data, error } = await supabase
        .from("cookies")
        .select("id,nome,descricao,preco,categoria,tags,imagem_url")
        .eq("ativo", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c) => ({
        ...c,
        preco: Number(c.preco),
        imagem_url: c.imagem_url ?? MOCK_IMAGES[c.nome] ?? null,
      }));
    },
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((c) => c.categoria && set.add(c.categoria));
    return Array.from(set);
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      if (activeCat && c.categoria !== activeCat) return false;
      if (!q) return true;
      return (
        c.nome.toLowerCase().includes(q) ||
        (c.descricao ?? "").toLowerCase().includes(q) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [data, query, activeCat]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBanner})` }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" aria-hidden />

          {/* Slogan marquee deslizante no fundo */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden opacity-15">
            <div className="flex gap-12 whitespace-nowrap animate-[marquee_30s_linear_infinite] text-[12vw] md:text-[8vw] font-black tracking-tighter text-primary">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="shrink-0">
                  GranCookie • Feitos com carinho •
                </span>
              ))}
            </div>
          </div>

          <div className="relative container mx-auto px-4 py-24 md:py-32 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/15 backdrop-blur p-3 mb-4">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight drop-shadow-sm">
              Cookies artesanais, feitos com carinho.
            </h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-2xl mx-auto">
              Escolha seus sabores favoritos, monte seu cookie ou assine o Cookie do Mês.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">Nossos cookies</h2>
            <div className="relative md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, sabor, tag..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge
                variant={activeCat === null ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setActiveCat(null)}
              >
                Todos
              </Badge>
              {categories.map((c) => (
                <Badge
                  key={c}
                  variant={activeCat === c ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setActiveCat(c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          )}

          {error && (
            <p className="text-destructive">Erro ao carregar cookies: {(error as Error).message}</p>
          )}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filtered.map((c) => (
                <CookieCard key={c.id} cookie={c} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              {query || activeCat
                ? "Nenhum cookie encontrado para o filtro."
                : "Nenhum cookie disponível no momento."}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
