import { FaArrowLeft } from "react-icons/fa";
import { useLocation } from "wouter";

const BackBtn = () => {
  const [_, setLocation] = useLocation();

  const handleBack = () => window.history.back();

  return (
    <div className="flex w-full justify-start py-3">
      <button
        onClick={handleBack}
        className="group flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all duration-200 ease-in-out hover:scale-105 hover:bg-muted hover:text-primary active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Go back"
      >
        <FaArrowLeft className="h-4 w-4 transition-transform duration-200 ease-in-out group-hover:-translate-x-0.5" />
      </button>
    </div>
  );
};

export default BackBtn;
