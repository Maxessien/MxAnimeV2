import { useLocation } from "wouter";

export default function NotFound() {
  const [_, navigate] = useLocation()
  const goHome = ()=> navigate("/");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 py-12 transition-colors duration-300">

      {/* Decorative blurred background accents leveraging your primary color */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative text-center max-w-md w-full flex flex-col items-center z-10">

        {/* Huge Animated 404 Display using font-mono (Space Grotesk) */}
        <h1 className="font-mono text-8xl md:text-9xl font-extrabold tracking-tighter text-primary drop-shadow-[0_4px_12px_rgba(255,41,96,0.15)] animate-bounce select-none">
          404
        </h1>

        {/* Dynamic Card Container for context */}
        <div className="mt-8 p-8 bg-card text-card-foreground border border-card-border rounded-xl shadow-xl w-full backdrop-blur-sm">

          <h2 className="font-sans text-2xl font-bold tracking-tight mb-3">
            Lost in Cyberspace?
          </h2>

          <p className="font-sans text-sm text-muted-foreground mb-6 balance">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          {/* Action Buttons styled around your primary/secondary theme system */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
            <button
              onClick={goHome}
              className="font-sans inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-lg shadow-md hover:opacity-90 active:scale-98 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
            >
              <svg xmlns="http://w3.org" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Go to Homepage
            </button>
          </div>
        </div>

        {/* Footer/Help Tip linking to system accent variables */}
        <p className="mt-8 font-sans text-xs text-muted-foreground">
          Need help? Contact our{' '}
          <a href="/support" className="text-primary hover:underline font-semibold transition-colors">
            support team
          </a>
        </p>

      </div>
    </div>
  );
}
