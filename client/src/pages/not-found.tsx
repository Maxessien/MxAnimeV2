import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="text-center space-y-6 bg-card p-12 rounded-3xl border shadow-lg max-w-md w-full">
        <div className="mx-auto w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={48} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl font-display font-black text-foreground tracking-tight">
          404
        </h1>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Page not found</h2>
          <p className="text-sm text-muted-foreground">
            The anime you're looking for might have been moved or doesn't exist.
          </p>
        </div>
        
        <Link 
          href="/" 
          className="inline-flex items-center justify-center w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
