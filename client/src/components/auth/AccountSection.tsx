import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, AUTH_SERVER_URL } from "@/hooks/use-auth";
import { LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useLocation } from "wouter";

type Mode = "login" | "register";

interface AuthUserForm {
  userName: string,
  email: string,
  phone: string,
  password: string
}

export function AccountSection() {
  const { isLoading, login, register, clearError } = useAuth();
  const { register: rhfRegister, formState: {errors}, handleSubmit, reset } = useForm<AuthUserForm>({
    defaultValues: {
      email: "",
      password: "",
      phone: "",
      userName: ""
    }, mode: "onTouched", disabled: !Boolean(AUTH_SERVER_URL),
  })

  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("login");

  const submit = async ({email, password, phone, userName}: AuthUserForm) => {
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
      reset();
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

      <form onSubmit={handleSubmit(submit)} className="space-y-4 border-t border-border/60 pt-4">
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
                autoComplete="name"
                {...rhfRegister(
                  "userName", mode === "register" ? {
                    required: "Username is required",
                    minLength:
                      { value: 3, message: "Username must be at least 3 characters long" },
                    maxLength:
                      { value: 25, message: "Username must be at most 25 characters long" },
                  } : undefined)
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              autoComplete="email"
              {...rhfRegister("email", mode === "register" ? {
                required: "Email is required",
                pattern: {value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid Email"}
              } : undefined)}
            />
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="auth-phone">Phone (optional)</Label>
              <Input
                autoComplete="tel"
                {...rhfRegister("phone")}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              {...rhfRegister("password", mode === "register" ? {
                required: "Password is required",
                minLength: { value: 8, message: "Password must be at least 8 characters long" },
                validate: (val) => {
                  if (!val.match(/[A-Z]+/)) return "Password must include an uppercase letter"
                  if (!val.match(/[a-z]+/)) return "Password must include a lowercase letter"
                  if (!val.match(/[0-9]+/)) return "Password must include a number"
                  return true
                }
              } : undefined)}
            />
          </div>

          <Button type="submit" disabled={isLoading || !Boolean(AUTH_SERVER_URL)}>
            {isLoading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
      </form>
    </section>
  );
}
