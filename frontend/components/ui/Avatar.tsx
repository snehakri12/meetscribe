import { colorForName } from "@/lib/constants";
import { initials } from "@/lib/format";

const SIZES = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

type AvatarProps = {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
};

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface ${SIZES[size]} ${className}`}
      style={{ backgroundColor: colorForName(name) }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  names,
  max = 4,
  size = "sm",
}: {
  names: string[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const visible = names.slice(0, max);
  const hidden = names.length - visible.length;
  return (
    <div className="flex items-center -space-x-1" aria-label={names.join(", ")}>
      {visible.map((name) => (
        <Avatar key={name} name={name} size={size} />
      ))}
      {hidden > 0 && (
        <span
          className={`inline-flex items-center justify-center rounded-full bg-surface-3 font-semibold text-muted ring-2 ring-surface ${SIZES[size]}`}
          title={names.slice(max).join(", ")}
        >
          +{hidden}
        </span>
      )}
    </div>
  );
}
