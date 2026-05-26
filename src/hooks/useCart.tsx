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
  subtotal: number;
  discount: number;
  total: number;
  count: number;
  coupon: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "cookieshop_cart_v1";
const COUPON_KEY = "cookieshop_coupon_v1";
const ABANDON_KEY = "cookieshop_abandon_shown";

// Cupons disponíveis (10% e 15%)
const COUPONS: Record<string, number> = {
  VOLTA10: 0.1,
  COOKIE15: 0.15,
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
      const c = localStorage.getItem(COUPON_KEY);
      if (c) setCoupon(c);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  // Cupom de abandono: se houver itens parados por 30s e ainda não mostramos, dispara
  useEffect(() => {
    if (items.length === 0) return;
    if (sessionStorage.getItem(ABANDON_KEY)) return;
    const t = setTimeout(() => {
      sessionStorage.setItem(ABANDON_KEY, "1");
      // import dinâmico para evitar dep ciclo
      import("sonner").then(({ toast }) => {
        toast("Ainda com fome? 🍪", {
          description: "Use o cupom VOLTA10 e ganhe 10% off no seu pedido!",
          duration: 12000,
          action: {
            label: "Aplicar",
            onClick: () => {
              setCoupon("VOLTA10");
              localStorage.setItem(COUPON_KEY, "VOLTA10");
              toast.success("Cupom VOLTA10 aplicado!");
            },
          },
        });
      });
    }, 30000);
    return () => clearTimeout(t);
  }, [items]);

  const value = useMemo<CartCtx>(() => {
    const subtotal = items.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const pct = coupon ? (COUPONS[coupon] ?? 0) : 0;
    const discount = subtotal * pct;
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
      clear: () => {
        setItems([]);
        setCoupon(null);
        localStorage.removeItem(COUPON_KEY);
      },
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
      count: items.reduce((s, i) => s + i.quantidade, 0),
      coupon,
      applyCoupon: (code) => {
        const upper = code.trim().toUpperCase();
        if (!COUPONS[upper]) return false;
        setCoupon(upper);
        localStorage.setItem(COUPON_KEY, upper);
        return true;
      },
      removeCoupon: () => {
        setCoupon(null);
        localStorage.removeItem(COUPON_KEY);
      },
    };
  }, [items, coupon]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used within CartProvider");
  return v;
}
