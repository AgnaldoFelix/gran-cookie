import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  nome: string;
  preco: number;
  imagem_url: string | null;
  quantidade: number;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantidade">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "cookieshop_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const value = useMemo<CartCtx>(() => {
    return {
      items,
      add: (item) =>
        setItems((cur) => {
          const found = cur.find((c) => c.id === item.id);
          if (found) return cur.map((c) => (c.id === item.id ? { ...c, quantidade: c.quantidade + 1 } : c));
          return [...cur, { ...item, quantidade: 1 }];
        }),
      remove: (id) => setItems((cur) => cur.filter((c) => c.id !== id)),
      setQty: (id, qty) =>
        setItems((cur) =>
          qty <= 0 ? cur.filter((c) => c.id !== id) : cur.map((c) => (c.id === id ? { ...c, quantidade: qty } : c)),
        ),
      clear: () => setItems([]),
      total: items.reduce((s, i) => s + i.preco * i.quantidade, 0),
      count: items.reduce((s, i) => s + i.quantidade, 0),
    };
  }, [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used within CartProvider");
  return v;
}
