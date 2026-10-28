import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ThemeToggle } from "@/components/theme-toggle";
import { ongoingDownloadQueue } from "@/lib/queue";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CalendarClock,
  Download,
  Flame,
  Search,
  Settings,
  Trophy,
  Tv,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import PullToRefresh from "react-simple-pull-to-refresh";
import { Link, useLocation, useSearchParams } from "wouter";
import { DynamicPullSpinner } from "./PullSpinner";

const navItems = [
  { href: "/", label: "Home", icon: Flame },
  { href: "/latest", label: "Latest", icon: Tv },
  { href: "/top", label: "Top Anime", icon: Trophy },
  { href: "/seasons", label: "Seasons", icon: Calendar },
  { href: "/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/search", label: "Search", icon: Search },
  { href: "/downloads", label: "Downloads", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [searchParams] = useSearchParams();
  const [ongoingCount, setOngoingCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const isActive = (href: string) =>
    location === href || (href !== "/" && location.startsWith(href));

  useEffect(() => {
    const listenerFn = () => {
      setOngoingCount(ongoingDownloadQueue.getElements.length);
    };
    ongoingDownloadQueue.addEventListener("modify", listenerFn);
    return () => {
      ongoingDownloadQueue.removeEventListener("modify", listenerFn);
    };
  }, []);

  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [searchParams, location]);

  return (
    <div className="h-dvh flex flex-col pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] md:flex-row bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden overflow-y-auto pb-[env(safe-area-inset-bottom)] scrollbar-hide md:flex md:flex-col w-64 shrink-0 border-r bg-background h-dvh">
        <Link
          href="/"
          className="flex items-center px-6 h-16 shrink-0 outline-none focus-visible:ring-2 ring-primary rounded-lg"
        >
          <div>
            <img
              className="w-12 aspect-square rounded-md"
              src="/icon-tran.png"
              alt="logo"
            />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            Anime
          </span>
        </Link>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
                {item.label === "Downloads" && ongoingCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                    {ongoingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t flex items-center justify-between shrink-0">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Theme
          </span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Mobile Top Header */}
        <header className="md:hidden shrink-0 border-b bg-background/80 backdrop-blur-xl">
          <div className="px-2 sm:px-4 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center px-6 h-16 shrink-0 outline-none focus-visible:ring-2 ring-primary rounded-lg"
            >
              <div>
                <img
                  className="w-12 aspect-square rounded-md"
                  src="/icon-tran.png"
                  alt="logo"
                />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                Anime
              </span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main
          key={refreshKey}
          ref={mainRef}
          className="flex-1 min-h-0 overflow-y-auto w-full container mx-auto px-2 sm:px-4 py-4 md:py-8 pb-2 md:pb-4"
        >
          <PullToRefresh
            pullingContent={<DynamicPullSpinner />}
            onRefresh={async () => setRefreshKey((prev) => prev + 1)}
          >
            {children}
          </PullToRefresh>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav navItems={navItems} isActive={isActive} />
    </div>
  );
}
