import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export type ComingSoonItem = {
  name: string;
  description: string;
  icon: IconName;
};

export function ComingSoonBadge() {
  return (
    <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
      Coming soon
    </span>
  );
}

/** Placeholder grid for features that are intentionally out of scope. */
export function ComingSoonGrid({ items }: { items: ComingSoonItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.name} className="card flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
              <Icon name={item.icon} size={20} />
            </span>
            <ComingSoonBadge />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{item.name}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
          </div>
          <button className="btn-secondary mt-auto w-full" disabled>
            Connect
          </button>
        </div>
      ))}
    </div>
  );
}
