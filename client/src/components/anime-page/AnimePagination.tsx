import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageInfo } from "@/types/anilist";

export function AnimePagination({ pageInfo, page, onPageChange }: { pageInfo?: PageInfo; page: number; onPageChange: (page: number) => void }) {
  if (!pageInfo || pageInfo.lastPage <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-3 border-t pt-6" aria-label="Anime pages">
      <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="flex items-center gap-1 rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium disabled:opacity-50">
        <ChevronLeft size={17} /> Previous
      </button>
      <span className="rounded-lg bg-muted px-3 py-2 text-sm font-semibold">Page {page} of {pageInfo.lastPage}</span>
      <button type="button" onClick={() => onPageChange(Math.min(pageInfo.lastPage, page + 1))} disabled={!pageInfo.hasNextPage} className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
        Next <ChevronRight size={17} />
      </button>
    </nav>
  );
}
