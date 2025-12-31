// app/components/dashboard/DashboardCards.tsx
import type { LucideIcon } from "lucide-react";

export type Card = {
  title: string;
  value: string | number;
  change: string;
  changeType: "positive" | "negative";
  icon: LucideIcon;
  color: string; // background for the icon container
};

export default function CardWithIcon({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="
            bg-[var(--card-bg)]
            text-[var(--card-text)]
            border border-[var(--border-color)]
            rounded-lg shadow p-6
            hover:shadow-lg
            transition-shadow
          "
        >
          <div className="flex items-center justify-between">
            <div>
              {/* Title */}
              <p className="text-sm font-medium opacity-80">{card.title}</p>

              {/* Value */}
              <p className="text-2xl font-bold mt-2">{card.value}</p>
            </div>

            {/* Icon box keeps its own theme color */}
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Change info */}
          <div className="mt-4 flex items-center">
            <span
              className={`text-sm font-medium ${
                card.changeType === "positive"
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {card.change}
            </span>
            <span className="text-sm opacity-70 ml-2">from last month</span>
          </div>
        </div>
      ))}
    </div>
  );
}