import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/perfil")({
  component: PerfilPage,
  head: () => ({ meta: [{ title: "Meu perfil — Cookie Shop" }] }),
});

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  pontos: number;
  assinante: boolean;
  creditos_cookies: number;
  assinatura_inicio: string | null;
  assinatura_proxima: string | null;
};

type Pedido = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  itens: { nome: string; quantidade: number }[];
};

function PerfilPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [assinando, setAssinando] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  const profile = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,nome,email,pontos,assinante,creditos_cookies,assinatura_inicio,assinatura_proxima")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  const pedidos = useQuery({
    enabled: !!user,
    queryKey: ["pedidos", user?.id],
    queryFn: async (): Promise<Pedido[]> => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("id,total,status,created_at,itens")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, total: Number(p.total), itens: (p.itens as any) ?? [] }));
    },
  });

  const assinar = async () => {
    if (!user) return;
    setAssinando(true);
    const agora = new Date();
    const proxima = new Date(agora);
    proxima.setMonth(proxima.getMonth() + 1);
    const { error } = await supabase
      .from("profiles")
      .update({
        assinante: true,
        creditos_cookies: (profile.data?.creditos_cookies ?? 0) + 8,
        assinatura_inicio: agora.toISOString(),
        assinatura_proxima: proxima.toISOString(),
      })
      .eq("id", user.id);
    setAssinando(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Assinatura ativada! 8 cookies creditados 🎉");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const cancelar = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ assinante: false, assinatura_proxima: null })
      .eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Assinatura cancelada");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-40 w-full" />
        </main>
      </div>
    );
  }

  const p = profile.data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <section>
          <h1 className="text-3xl font-bold">Olá, {p?.nome ?? user.email}</h1>
          <p className="text-muted-foreground">{p?.email ?? user.email}</p>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" /> Cookie do Mês
              </CardTitle>
              <CardDescription>
                Receba 8 cookies surpresa todo mês direto na sua porta.
              </CardDescription>
            </div>
            {p?.assinante && <Badge>Ativa</Badge>}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Créditos de cookies</p>
                <p className="text-2xl font-bold">{p?.creditos_cookies ?? 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Pontos</p>
                <p className="text-2xl font-bold">{p?.pontos ?? 0}</p>
              </div>
            </div>
            {p?.assinante ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Próxima entrega: {p.assinatura_proxima
                    ? new Date(p.assinatura_proxima).toLocaleDateString("pt-BR")
                    : "—"}
                </p>
                <Button variant="outline" onClick={cancelar}>Cancelar assinatura</Button>
              </div>
            ) : (
              <Button onClick={assinar} disabled={assinando} className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4 mr-2" />
                {assinando ? "Ativando..." : "Assinar por R$ 79,90/mês (simulado)"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Meus pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pedidos.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : pedidos.data && pedidos.data.length > 0 ? (
              <ul className="divide-y">
                {pedidos.data.map((ped) => (
                  <li key={ped.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">
                        {new Date(ped.created_at).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ped.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-primary">
                        R$ {ped.total.toFixed(2).replace(".", ",")}
                      </p>
                      <Badge variant="secondary" className="text-xs">{ped.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                Você ainda não fez pedidos. <Link to="/" className="text-primary underline">Ver catálogo</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
