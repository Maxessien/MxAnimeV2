import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { Calendar, CalendarClock, Download, Flame, History, Search, Settings, Trophy } from 'lucide-react';
import { Link, useLocation } from 'wouter';

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
    <div className="min-h-dvh flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r bg-background sticky top-0 h-dvh">
        <Link href="/" className="flex items-center gap-2 px-6 h-16 shrink-0 outline-none focus-visible:ring-2 ring-primary rounded-lg">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
            <Flame size={20} strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">MxAnime</span>
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

        <div className="p-4 border-t flex items-center justify-between shrink-0">
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
              <span className="font-display font-bold text-xl tracking-tight">MxAnime</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex flex-col w-full container mx-auto px-4 py-8 pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav navItems={navItems} isActive={isActive} />
    </div>
  );
}
