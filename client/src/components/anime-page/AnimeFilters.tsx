import { ChevronDown, Filter, RotateCcw, Search, X } from "lucide-react";
import { useState } from "react";
import { AnimePageFilters } from "./anime-page.types";
import {
  FORMAT_OPTIONS,
  SEASONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
} from "./anime-page.types";
import { yearsForFilter } from "./anime-page.utils";

interface AnimeFiltersProps {
  filters: AnimePageFilters;
  onChange: (changes: Partial<AnimePageFilters>) => void;
  onReset: () => void;
}

export function AnimeFilters({ filters, onChange, onReset }: AnimeFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const update = (changes: Partial<AnimePageFilters>) => onChange({ ...changes, page: 1 });

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="flex items-center gap-2 rounded-lg text-left font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Filter className="text-primary" size={20} />
          <span>Filter anime</span>
          <ChevronDown className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} size={18} />
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {isOpen && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative sm:col-span-2 lg:col-span-4">
          <span className="sr-only">Search anime</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value, page: 1 })}
            placeholder="Search by title..."
            className="h-11 w-full rounded-xl border bg-muted/40 pl-10 pr-10 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => update({ query: "" })}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={17} />
            </button>
          )}
        </label>

        <FilterSelect label="Format" value={filters.format} options={FORMAT_OPTIONS} onChange={(value) => update({ format: value as AnimePageFilters["format"] })} />
        <FilterSelect label="Year" value={filters.year} options={[{ value: "All" as const, label: "Any year" }, ...yearsForFilter().map((year) => ({ value: year, label: String(year) }))]} onChange={(value) => update({ year: value as AnimePageFilters["year"] })} />
        <FilterSelect label="Season" value={filters.season} options={SEASONS} onChange={(value) => update({ season: value as AnimePageFilters["season"] })} />
        <FilterSelect label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(value) => update({ status: value as AnimePageFilters["status"] })} />
        <FilterSelect label="Sort by" value={filters.sort} options={SORT_OPTIONS} onChange={(value) => update({ sort: value as AnimePageFilters["sort"] })} />
      </div>
      }
    </section>
  );
}

function FilterSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={String(value)}
        onChange={(event) => {
          const option = options.find((item) => String(item.value) === event.target.value);
          if (option) onChange(option.value);
        }}
        className="h-11 w-full min-w-0 rounded-xl border bg-muted/40 px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
