import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STATUSES = ["pago", "preparando", "saiu_entrega", "entregue", "cancelado"] as const;
type Status = (typeof STATUSES)[number];

const statusLabel: Record<Status, string> = {
  pago: "Pago",
  preparando: "Preparando",
  saiu_entrega: "Saiu p/ entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const statusVariant: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  pago: "secondary",
  preparando: "default",
  saiu_entrega: "default",
  entregue: "outline",
  cancelado: "destructive",
};

export function AdminPedidos() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  async function updateStatus(id: string, status: Status) {
    const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Status atualizado: ${statusLabel[status]}`);
    qc.invalidateQueries({ queryKey: ["admin", "pedidos"] });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-muted-foreground">Nenhum pedido ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((p) => {
        const itens = Array.isArray(p.itens) ? (p.itens as Array<{ nome: string; qty: number }>) : [];
        const status = p.status as Status;
        return (
          <Card key={p.id} className="p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-muted-foreground">#{p.id.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(p.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={statusVariant[status] ?? "secondary"}>
                  {statusLabel[status] ?? status}
                </Badge>
                <p className="font-bold mt-1">
                  R$ {Number(p.total).toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>

            <div className="text-sm">
              {itens.map((it, i) => (
                <span key={i} className="text-muted-foreground">
                  {it.qty}× {it.nome}
                  {i < itens.length - 1 ? " · " : ""}
                </span>
              ))}
            </div>

            {p.endereco && (
              <p className="text-sm">
                <span className="text-muted-foreground">Entrega:</span> {p.endereco}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === status ? "default" : "outline"}
                  onClick={() => updateStatus(p.id, s)}
                  disabled={s === status}
                >
                  {statusLabel[s]}
                </Button>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
