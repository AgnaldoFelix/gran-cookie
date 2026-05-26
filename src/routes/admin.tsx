import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Plus, Trash2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { generateCookieDraft } from "@/lib/cookies-ai.functions";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Draft = {
  nome: string;
  descricao: string;
  preco: string;
  categoria: string;
  tags: string;
  imagem_url: string;
};

const emptyDraft: Draft = {
  nome: "",
  descricao: "",
  preco: "",
  categoria: "",
  tags: "",
  imagem_url: "",
};

const SaveSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(60),
  descricao: z.string().trim().max(280).optional(),
  preco: z.number().min(0.5).max(500),
  categoria: z.string().trim().max(40).optional(),
  tags: z.array(z.string().min(1).max(20)).max(8),
  imagem_url: z.string().trim().url().max(500).optional().or(z.literal("")),
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const generate = useServerFn(generateCookieDraft);

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: cookies, isLoading } = useQuery({
    queryKey: ["admin", "cookies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cookies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  if (loading) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Acesso restrito</h1>
          <p className="text-muted-foreground mt-2">
            Esta área é apenas para administradores.
          </p>
        </div>
      </div>
    );
  }

  async function handleGenerate() {
    if (prompt.trim().length < 3) {
      toast.error("Descreva a ideia do cookie");
      return;
    }
    setGenerating(true);
    try {
      const result = await generate({ data: { prompt } });
      setDraft({
        nome: result.nome,
        descricao: result.descricao,
        preco: result.preco.toFixed(2),
        categoria: result.categoria,
        tags: result.tags.join(", "),
        imagem_url: "",
      });
      toast.success("Cookie gerado! Revise e salve.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Imagem maior que 3MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("cookie-images")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("cookie-images").getPublicUrl(path);
      setDraft((d) => ({ ...d, imagem_url: data.publicUrl }));
      toast.success("Imagem enviada!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSave() {
    const parsed = SaveSchema.safeParse({
      nome: draft.nome,
      descricao: draft.descricao || undefined,
      preco: Number(draft.preco.replace(",", ".")),
      categoria: draft.categoria || undefined,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      imagem_url: draft.imagem_url || "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("cookies").insert({
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      preco: parsed.data.preco,
      categoria: parsed.data.categoria ?? null,
      tags: parsed.data.tags,
      imagem_url: parsed.data.imagem_url || null,
      ativo: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Cookie salvo 🍪");
    setDraft(emptyDraft);
    setPrompt("");
    qc.invalidateQueries({ queryKey: ["admin", "cookies"] });
    qc.invalidateQueries({ queryKey: ["cookies"] });
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este cookie?")) return;
    const { error } = await supabase.from("cookies").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    qc.invalidateQueries({ queryKey: ["admin", "cookies"] });
    qc.invalidateQueries({ queryKey: ["cookies"] });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        <header>
          <h1 className="text-3xl font-bold">Admin · Cookies</h1>
          <p className="text-muted-foreground">
            Gere e cadastre novos sabores com ajuda da IA.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Gerar com IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ex.: cookie de pistache com gotas de chocolate branco"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <Label>Nome</Label>
                <Input
                  value={draft.nome}
                  onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Preço (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={draft.preco}
                  onChange={(e) => setDraft({ ...draft, preco: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  value={draft.descricao}
                  onChange={(e) => setDraft({ ...draft, descricao: e.target.value })}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={draft.categoria}
                  onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}
                />
              </div>
              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={draft.tags}
                  onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Imagem</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://... (ou envie arquivo)"
                    value={draft.imagem_url}
                    onChange={(e) => setDraft({ ...draft, imagem_url: e.target.value })}
                  />
                  <Button asChild variant="outline" disabled={uploading}>
                    <label className="cursor-pointer">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                      />
                    </label>
                  </Button>
                </div>
                {draft.imagem_url && (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img
                    src={draft.imagem_url}
                    alt="Pré-visualização"
                    className="h-32 w-32 object-cover rounded-md border"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(emptyDraft)}>
                Limpar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Plus className="h-4 w-4 mr-1" />
                {saving ? "Salvando..." : "Salvar cookie"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-xl font-bold mb-4">Catálogo</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cookies?.map((c) => (
                <Card key={c.id} className="flex items-center gap-3 p-3">
                  <div className="h-14 w-14 rounded-md bg-muted overflow-hidden flex-shrink-0">
                    {c.imagem_url && (
                      <img src={c.imagem_url} alt={c.nome} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{c.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {Number(c.preco).toFixed(2).replace(".", ",")}
                      {c.categoria && (
                        <Badge variant="secondary" className="ml-2">{c.categoria}</Badge>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(c.id)}
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
