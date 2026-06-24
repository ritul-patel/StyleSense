import { ExpandMore, Search } from "lucide-react";
type SearchBarProps = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  sortOption: string;
  setSortOption: (val: string) => void;
};

export default function SearchBar({ searchQuery, setSearchQuery, sortOption, setSortOption }: SearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#747686] dark:text-[#a0a0b8] text-[20px]" />
        <input
          type="text"
          placeholder="Search saved looks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-[#1b1c1b] border border-[#f0edec] dark:border-[#303030] text-sm text-[#1b1c1b] dark:text-[#fcf9f8] placeholder-[#747686] dark:placeholder-[#a0a0b8] focus:outline-none focus:border-[#1b1c1b] dark:focus:border-white transition-colors"
        />
      </div>
      <div className="sm:w-40 relative">
        <ExpandMore className="absolute right-4 top-1/2 -translate-y-1/2 text-[#747686] dark:text-[#a0a0b8] text-[20px] pointer-events-none" />
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-[#1b1c1b] border border-[#f0edec] dark:border-[#303030] text-sm font-bold text-[#1b1c1b] dark:text-[#fcf9f8] appearance-none focus:outline-none focus:border-[#1b1c1b] dark:focus:border-white transition-colors cursor-pointer"
        >
          <option value="Newest">Newest</option>
          <option value="Oldest">Oldest</option>
          <option value="A-Z">A-Z</option>
          <option value="Z-A">Z-A</option>
        </select>
      </div>
    </div>
  );
}
