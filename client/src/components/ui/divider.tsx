interface DividerProps {
  label?: string;
  className?: string;
}

function Divider({ label, className = "" }: DividerProps) {
  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-xs font-medium text-outline uppercase tracking-wider">{label}</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>
    );
  }
  return <div className={`h-px bg-outline-variant ${className}`} />;
}

export { Divider };
