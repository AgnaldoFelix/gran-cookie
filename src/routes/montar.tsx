import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Cookie as CookieIcon, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildCustomCookie, type CustomCookie } from "@/lib/custom-cookie.functions";
import { useCart } from "@/hooks/useCart";

export const Route = createFileRoute("/montar")({
  component: MontarPage,
  head: () => ({ meta: [{ title: "Monte seu cookie com IA — GranCookie" }] }),
});

function MontarPage() {
  const build = useServerFn(buildCustomCookie);
  const { add } = useCart();
  const [form, setForm] = useState({ base: "", recheio: "", cobertura: "", extras: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CustomCookie | null>(null);

  const gerar = async () => {
    if (!form.base.trim()) return toast.error("Escolha pelo menos a base");
    setLoading(true);
    try {
      const r = await build({ data: form });
      setResult(r);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const adicionar = () => {
    if (!result) return;
    add({
      id: `custom-${crypto.randomUUID()}`,
      nome: `${result.emoji} ${result.nome}`,
      preco: result.preco_sugerido,
      imagem_url: null,
    });
    toast.success("Cookie personalizado adicionado ao carrinho!");
    setResult(null);
    setForm({ base: "", recheio: "", cobertura: "", extras: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-3">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Monte seu cookie com IA</h1>
          <p className="text-muted-foreground mt-2">
            Combine ingredientes e nossa IA cria um cookie único para você.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ingredientes</CardTitle>
            <CardDescription>Quanto mais detalhes, mais saboroso fica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Base * (ex.: chocolate, baunilha, aveia)</Label>
              <Input value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} />
            </div>
            <div>
              <Label>Recheio (ex.: doce de leite, nutella)</Label>
              <Input value={form.recheio} onChange={(e) => setForm({ ...form, recheio: e.target.value })} />
            </div>
            <div>
              <Label>Cobertura (ex.: chocolate branco, glacê)</Label>
              <Input value={form.cobertura} onChange={(e) => setForm({ ...form, cobertura: e.target.value })} />
            </div>
            <div>
              <Label>Extras (ex.: castanhas, M&Ms, flor de sal)</Label>
              <Input value={form.extras} onChange={(e) => setForm({ ...form, extras: e.target.value })} />
            </div>
            <Button onClick={gerar} disabled={loading} className="w-full" size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              {loading ? "Criando seu cookie..." : "Gerar meu cookie"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6 border-primary/40">
            <CardHeader>
              <div className="text-5xl mb-2">{result.emoji || "🍪"}</div>
              <CardTitle>{result.nome}</CardTitle>
              <CardDescription>{result.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                R$ {result.preco_sugerido.toFixed(2).replace(".", ",")}
              </span>
              <Button onClick={adicionar}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Adicionar ao carrinho
              </Button>
            </CardContent>
          </Card>
        )}

        {!result && !loading && (
          <p className="text-center text-sm text-muted-foreground mt-6 flex items-center justify-center gap-1">
            <CookieIcon className="h-4 w-4" /> Sua criação aparecerá aqui
          </p>
        )}
      </main>
    </div>
  );
}
