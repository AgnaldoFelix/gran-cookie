import { Link } from "@tanstack/react-router";
import { Cookie, LogIn, LogOut, User as UserIcon, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-40">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Cookie className="h-6 w-6 text-primary" />
          <span>Cookie Shop</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="relative">
            <Link to="/carrinho" aria-label="Carrinho">
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">{count}</Badge>
              )}
            </Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">Admin</Link>
            </Button>
          )}
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/perfil">
                  <UserIcon className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Perfil</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-1" /> Entrar
              </Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
