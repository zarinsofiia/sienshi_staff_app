// app/components/dashboard/QuickStats.tsx
type Stat = {
  label: string;
  value: string | number;
};

export default function QuickStats({ stats }: { stats: Stat[] }) {
  return (
    <div
      className="
        rounded-lg shadow p-6
        bg-[var(--card-bg)]
        text-[var(--card-text)]
        border border-[var(--border-color)]
      "
    >
      <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
      <div className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="opacity-80">{stat.label}</span>
            <span className="font-semibold">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}