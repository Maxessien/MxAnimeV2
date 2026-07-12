import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavItem = { href: string; label: string; icon: LucideIcon };

// Rough width (px) each icon+label tab needs before it starts feeling cramped.
const ITEM_MIN_WIDTH = 64;

export function MobileBottomNav({
  navItems,
  isActive,
}: {
  navItems: NavItem[];
  isActive: (href: string) => boolean;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const [visibleCount, setVisibleCount] = useState(navItems.length);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const width = el.offsetWidth;
      const maxFit = Math.max(1, Math.floor(width / ITEM_MIN_WIDTH));
      // Leave room for the "More" trigger itself whenever not everything fits.
      setVisibleCount(maxFit >= navItems.length ? navItems.length : Math.max(1, maxFit - 1));
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [navItems.length]);

  useEffect(() => {
    if (!moreOpen) return;
    const close = () => setMoreOpen(false);
    window.addEventListener('click', close);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('resize', close);
    };
  }, [moreOpen]);

  const collapsed = visibleCount < navItems.length;
  const shown = collapsed ? navItems.slice(0, visibleCount) : navItems;
  const overflow = collapsed ? navItems.slice(visibleCount) : [];
  const overflowActive = overflow.some((item) => isActive(item.href));

  return (
    <nav
      ref={containerRef}
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur-xl flex items-center justify-around h-16 px-1 pb-[env(safe-area-inset-bottom)]"
    >
      {shown.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 rounded-lg transition-colors',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium leading-none truncate max-w-full px-0.5">{item.label}</span>
          </Link>
        );
      })}

      {collapsed && (
        <div className="relative flex-1 h-full min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMoreOpen((v) => !v);
            }}
            aria-label="More navigation options"
            aria-expanded={moreOpen}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 w-full h-full rounded-lg transition-colors',
              overflowActive || moreOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>

          {moreOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-full right-0 mb-2 w-44 bg-popover text-popover-foreground border rounded-xl shadow-lg overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              {overflow.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                      active ? 'text-primary bg-primary/10' : 'hover:bg-muted'
                    )}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
