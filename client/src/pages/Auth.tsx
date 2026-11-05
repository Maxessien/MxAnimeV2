import { AccountSection } from "@/components/auth/AccountSection";
import { Link } from "wouter";

export default function Auth() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 py-8">
      <div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to Anime Hub
        </Link>
        <h1 className="mt-4 text-3xl font-display font-extrabold tracking-tight">
          Your account
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sign in or create an account to access your profile across devices.
        </p>
      </div>
      <AccountSection />
    </div>
  );
}
