type FolderProps = {
  id: string;
  name: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
};

export default function FolderCard({ id, name, icon, isSelected, onClick }: FolderProps) {
  return (
    <button
      onClick={onClick}
      className={`snap-start whitespace-nowrap px-5 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all flex items-center gap-2 border ${
        isSelected
          ? "bg-[#1b1c1b] text-white border-[#1b1c1b] dark:bg-white dark:text-[#1b1c1b] dark:border-white"
          : "bg-white text-[#434654] border-[#f0edec] hover:bg-[#f0edec] dark:bg-[#1b1c1b] dark:text-[#a0a0b8] dark:border-[#303030] dark:hover:bg-[#303030]"
      }`}
    >
      <span>{icon}</span>
      {name}
    </button>
  );
}
