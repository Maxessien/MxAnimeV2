import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { Link } from "wouter";

export function AccountStatus() {
  const { user, logout, isLoading } = useAuth();

  return (
    <section className="bg-card border rounded-2xl p-6 space-y-4">
      <h2 className="font-bold text-lg">Account</h2>
      {user ? (
        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <UserRound size={18} />
            </div>
            <div>
              <p className="font-medium">{user.user_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} disabled={isLoading}>
            <LogOut /> Log out
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <p className="text-sm text-muted-foreground">
            Sign in or create an account to access your profile across devices.
          </p>
          <Button asChild>
            <Link href="/auth">
              <LogIn /> Sign in
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
