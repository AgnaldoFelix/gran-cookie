import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Package, Truck, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { DeliveryMap } from "@/components/DeliveryMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/pedido/$id")({
  component: PedidoPage,
  head: () => ({ meta: [{ title: "Rastreio — GranCookie" }] }),
});

// Loja base (São Paulo - Av Paulista)
const ORIGIN = { lat: -23.5613, lng: -46.6565 };
// Destino simulado (Vila Mariana)
const DEST = { lat: -23.589, lng: -46.6345 };

function PedidoPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState(0); // 0..1 entregador percorrendo

  useEffect(() => {
    const t = setInterval(() => setProgress((p) => (p >= 1 ? 1 : +(p + 0.05).toFixed(2))), 2000);
    return () => clearInterval(t);
  }, []);

  const pedido = useQuery({
    enabled: !!user,
    queryKey: ["pedido", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("id,total,status,created_at,endereco,itens")
        .eq("id", id)
        .single();
      if (error) throw error;
      return { ...data, total: Number(data.total), itens: (data.itens as any) ?? [] };
    },
  });

  const courier = {
    lat: ORIGIN.lat + (DEST.lat - ORIGIN.lat) * progress,
    lng: ORIGIN.lng + (DEST.lng - ORIGIN.lng) * progress,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/perfil"><ArrowLeft className="h-4 w-4 mr-1" /> Meus pedidos</Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Pedido
              </span>
              <Badge>{pedido.data?.status ?? "—"}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {authLoading || pedido.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : pedido.error ? (
              <p className="text-destructive text-sm">Pedido não encontrado.</p>
            ) : (
              <>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {new Date(pedido.data!.created_at).toLocaleString("pt-BR")}
                </div>
                <div className="text-sm flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{pedido.data!.endereco}</span>
                </div>
                <ul className="text-sm divide-y rounded-md border">
                  {(pedido.data!.itens as Array<{ nome: string; quantidade: number; preco: number }>).map((i, idx) => (
                    <li key={idx} className="flex justify-between p-2">
                      <span>{i.quantidade}× {i.nome}</span>
                      <span className="text-muted-foreground">
                        R$ {(i.preco * i.quantidade).toFixed(2).replace(".", ",")}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-semibold pt-1">
                  <span>Total</span>
                  <span className="text-primary">R$ {pedido.data!.total.toFixed(2).replace(".", ",")}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Rastreio em tempo real
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DeliveryMap origin={ORIGIN} destination={DEST} courier={courier} className="h-72 w-full rounded-lg border" />
            <div className="text-sm text-muted-foreground">
              {progress < 1
                ? `Entregador a caminho • ${Math.round(progress * 100)}% do trajeto`
                : "Entregue! Aproveite seus cookies 🍪"}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
