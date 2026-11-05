import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { LogIn, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { useLocation } from "wouter";

type Mode = "login" | "register";

export function AccountSection() {
  const { isLoading, login, register, clearError } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    try {
      if (mode === "register") {
        await register({
          user_name: userName.trim(),
          email: email.trim(),
          password,
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        });
        toast.success("Account created and signed in successfully.");
      } else {
        await login({ email: email.trim(), password });
        toast.success("Signed in successfully.");
      }
      setPassword("");
      setLocation("/settings");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Authentication request failed.");
    }
  };

  return (
    <section className="bg-card border rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="font-bold text-lg">Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to keep your account available across devices.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 border-t border-border/60 pt-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "outline"}
              onClick={() => { setMode("login"); clearError(); }}
            >
              <LogIn /> Sign in
            </Button>
            <Button
              type="button"
              variant={mode === "register" ? "default" : "outline"}
              onClick={() => { setMode("register"); clearError(); }}
            >
              <UserPlus /> Create account
            </Button>
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="auth-user-name">Username</Label>
              <Input
                id="auth-user-name"
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="auth-phone">Phone (optional)</Label>
              <Input
                id="auth-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </div>

          <Button type="submit" disabled={isLoading || AUTH_SERVER_URL}>
            {isLoading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
      </form>
    </section>
  );
}
