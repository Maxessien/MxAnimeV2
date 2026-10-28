import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { AnimeCardSkeleton } from "../AnimeCard";
import { JSX } from "react/jsx-runtime";

interface HomeSectionProps {
  title: string;
  subTitle?: string;
  viewAllHref: string;
  viewAllText: string;
  isError: boolean;
  isLoading: boolean;
  list: JSX.Element;
}

const HomeSection = ({
  isError,
  isLoading,
  list,
  title,
  viewAllHref,
  viewAllText,
  subTitle,
}: HomeSectionProps) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <span className="w-2 h-8 bg-primary rounded-full inline-block" />
            {title}
          </h2>
          <p className="text-muted-foreground mt-1 ml-5 text-sm md:text-base">
            {subTitle}
          </p>
        </div>
        <Link
          href={viewAllHref}
          className="hidden md:flex text-muted-foreground hover:text-primary items-center gap-1 text-sm font-medium transition-colors bg-muted px-4 py-2 rounded-full"
        >
          {viewAllText} <ArrowRight size={16} />
        </Link>
      </div>

      {isError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          Failed to load.
        </div>
      )}

      <div className="flex overflow-x-auto scrollbar-hide w-full gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <AnimeCardSkeleton extraStyles="w-50" key={i} />
            ))
          : list}
      </div>

      <div className="mt-8 md:hidden flex justify-center">
        <Link
          href={viewAllHref}
          className="text-muted-foreground hover:text-primary flex items-center gap-1 text-sm font-medium transition-colors bg-muted px-6 py-3 rounded-full w-full justify-center"
        >
          {viewAllText} <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
};

export default HomeSection;
