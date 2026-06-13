type OutfitCardProps = {
  title: string;
  description: string;
  index: number;
};

const gradients = [
  "from-[#e8ddd2] via-[#dac9bb] to-[#b9a492]",
  "from-[#f0dfd2] via-[#ddc2ad] to-[#c39a7f]",
  "from-[#e2d8cf] via-[#ccb9aa] to-[#a88f7f]",
  "from-[#efe2d7] via-[#d8beab] to-[#b8977f]",
];

export default function OutfitCard({ outfit }: { outfit: any }) {
  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-200">
      
      <h3 className="font-bold text-lg">{outfit.title}</h3>
      
      <p className="text-sm text-gray-700 mt-1">
        {outfit.description}
      </p>

      {/* colors */}
      <div className="flex gap-2 mt-3">
        {outfit.colors?.map((c: string, i: number) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full border"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <p className="text-xs mt-2 text-gray-600">
        {outfit.occasion}
      </p>
    </div>
  );
}
