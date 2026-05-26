import { Cookie } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

export type CookieItem = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string | null;
  tags: string[];
  imagem_url: string | null;
};

export function CookieCard({ cookie }: { cookie: CookieItem }) {
  const { add } = useCart();
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="aspect-square w-full bg-muted flex items-center justify-center">
        {cookie.imagem_url ? (
          <img src={cookie.imagem_url} alt={`Imagem de ${cookie.nome}`} className="h-full w-full object-cover" />
        ) : (
          <Cookie className="h-16 w-16 text-muted-foreground/40" />
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{cookie.nome}</h3>
          <span className="font-bold text-primary whitespace-nowrap">
            R$ {cookie.preco.toFixed(2).replace(".", ",")}
          </span>
        </div>
        {cookie.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2">{cookie.descricao}</p>
        )}
        <div className="flex flex-wrap gap-1 pt-1">
          {cookie.categoria && <Badge variant="secondary">{cookie.categoria}</Badge>}
          {cookie.tags?.slice(0, 2).map((t) => (
            <Badge key={t} variant="outline">{t}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          size="sm"
          onClick={() => {
            add({ id: cookie.id, nome: cookie.nome, preco: cookie.preco, imagem_url: cookie.imagem_url });
            toast.success(`${cookie.nome} adicionado ao carrinho`);
          }}
        >
          Adicionar 🍪
        </Button>
      </CardFooter>
    </Card>
  );
}
