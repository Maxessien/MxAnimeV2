import { Link, useLocation } from 'wouter';
import { Search, Flame, Calendar, CalendarClock, Trophy, History, Download, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Flame },
  { href: '/top', label: 'Top Anime', icon: Trophy },
  { href: '/seasons', label: 'Seasons', icon: Calendar },
  { href: '/schedule', label: 'Schedule', icon: CalendarClock },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/history', label: 'History', icon: History },
  { href: '/downloads', label: 'Downloads', icon: Download },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isActive = (href: string) => location === href || (href !== '/' && location.startsWith(href));

  return (
    <div className="min-h-[100dvh] flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 flex-shrink-0 border-r bg-background sticky top-0 h-[100dvh]">
        <Link href="/" className="flex items-center gap-2 px-6 h-16 flex-shrink-0 outline-none focus-visible:ring-2 ring-primary rounded-lg">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
            <Flame size={20} strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Anime Hub</span>
        </Link>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Theme</span>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
          <div className="px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 outline-none rounded-lg focus-visible:ring-2 ring-primary">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
                <Flame size={20} strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">Anime Hub</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex flex-col w-full container mx-auto px-4 py-8 pb-8">
          {children}
        </main>

        <footer className="border-t py-12 text-center text-sm text-muted-foreground bg-muted/30">
          <div className="flex flex-col items-center gap-2">
            <div className="bg-primary/20 text-primary p-2 rounded-full mb-2">
              <Flame size={20} />
            </div>
            <p className="font-medium text-foreground">Anime Hub</p>
            <p>Powered by <a href="https://jikan.moe" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">Jikan API</a></p>
            <p className="text-xs max-w-sm mx-auto mt-2 opacity-70">Not affiliated with MyAnimeList. This is a passionate database built for anime fans.</p>
          </div>
        </footer>

        {/* Spacer so content/footer isn't hidden behind the mobile bottom nav */}
        <div className="md:hidden h-16 flex-shrink-0" aria-hidden="true" />
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav navItems={navItems} isActive={isActive} />
    </div>
  );
}
