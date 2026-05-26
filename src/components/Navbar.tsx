import { Link } from "@tanstack/react-router";
import { Cookie, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-40">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Cookie className="h-6 w-6 text-primary" />
          <span>Cookie Shop</span>
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">Admin</Link>
            </Button>
          )}
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/perfil">
                  <UserIcon className="h-4 w-4 mr-1" /> Perfil
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1" /> Sair
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
