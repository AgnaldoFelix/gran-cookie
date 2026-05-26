import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Cookie, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/carrinho")({
  component: CarrinhoPage,
  head: () => ({ meta: [{ title: "Carrinho — Cookie Shop" }] }),
});

function CarrinhoPage() {
  const { items, setQty, remove, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(false);

  const finalizar = async () => {
    if (!user) {
      toast.error("Faça login para finalizar o pedido");
      navigate({ to: "/auth" });
      return;
    }
    if (items.length === 0) return;
    if (!endereco.trim()) {
      toast.error("Informe o endereço de entrega");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("pedidos").insert({
      user_id: user.id,
      itens: items,
      total,
      endereco,
      status: "pago",
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao finalizar: " + error.message);
      return;
    }
    clear();
    toast.success("Pedido realizado! 🍪");
    navigate({ to: "/perfil" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Seu carrinho</h1>
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Seu carrinho está vazio.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((i) => (
              <Card key={i.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-16 w-16 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {i.imagem_url ? (
                      <img src={i.imagem_url} alt={i.nome} className="h-full w-full object-cover" />
                    ) : (
                      <Cookie className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{i.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {i.preco.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" onClick={() => setQty(i.id, i.quantidade - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{i.quantidade}</span>
                    <Button size="icon" variant="outline" onClick={() => setQty(i.id, i.quantidade + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(i.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
                <Input
                  placeholder="Endereço de entrega"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                />
                <Button className="w-full" size="lg" onClick={finalizar} disabled={loading}>
                  {loading ? "Processando..." : "Finalizar pedido (simulado)"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
