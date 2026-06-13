type CTAButtonProps = {
  label: string;
  onClick: () => void;
};

export default function CTAButton({ label, onClick }: CTAButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-black px-8 py-3 text-white transition hover:opacity-90"
    >
      {label}
    </button>
  );
}
