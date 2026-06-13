type ResultHeaderProps = {
  title: string;
  subtitle: string;
};

export default function ResultHeader({ title, subtitle }: ResultHeaderProps) {
  return (
    <section className="mb-12 text-center md:mb-16 md:text-left">
      <h1 className="text-5xl font-extrabold tracking-[-0.045em] text-[#2d3433] md:text-6xl">{title}</h1>
      <p className="mt-4 text-lg font-light leading-relaxed text-[#5a6060]">{subtitle}</p>
    </section>
  );
}
