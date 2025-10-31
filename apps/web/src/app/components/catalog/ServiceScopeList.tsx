import type { FC, ReactNode } from "react";

type ServiceScopeListProps = {
  title: string;
  items?: string[] | null;
  iconVariant?: "positive" | "negative" | "info";
  className?: string;
};

const ICON_VARIANTS: Record<NonNullable<ServiceScopeListProps["iconVariant"]>, {
  icon: ReactNode;
  iconWrapperClass: string;
}> = {
  positive: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    ),
    iconWrapperClass: "bg-emerald-100 text-emerald-600",
  },
  negative: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </svg>
    ),
    iconWrapperClass: "bg-rose-100 text-rose-600",
  },
  info: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M12 8h.01" />
        <path d="M11 12h1v4h1" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    iconWrapperClass: "bg-sky-100 text-sky-600",
  },
};

const joinClassNames = (base: string, extra?: string) =>
  extra ? `${base} ${extra}` : base;

const LINK_REGEX = /(https?:\/\/[^\s]+)/gi;

function renderItemText(text: string) {
  const segments = text.split(LINK_REGEX);

  if (segments.length === 1) {
    return text;
  }

  const matches = text.match(LINK_REGEX) ?? [];
  const nodes: ReactNode[] = [];

  segments.forEach((segment, index) => {
    if (segment) {
      nodes.push(segment);
    }

    const link = matches[index];
    if (link) {
      nodes.push(
        <a
          key={`${link}-${index}`}
          href="#"
          className="text-emerald-600 underline-offset-2 transition hover:text-emerald-700 hover:underline"
        >
          {link}
        </a>,
      );
    }
  });

  return nodes;
}

export const ServiceScopeList: FC<ServiceScopeListProps> = ({
  title,
  items,
  iconVariant = "positive",
  className,
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  const preparedItems = items
    .map((item) => (typeof item === "string" ? item.trim() : String(item).trim()))
    .filter((item) => item.length > 0);

  if (preparedItems.length === 0) {
    return null;
  }

  const { icon, iconWrapperClass } = ICON_VARIANTS[iconVariant];

  return (
    <div className={joinClassNames("space-y-3", className)}>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <ul className="space-y-2">
        {preparedItems.map((item, index) => (
          <li
            key={`${iconVariant}-${index}-${item.slice(0, 24)}`}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm"
          >
            <span
              className={joinClassNames(
                "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full",
                iconWrapperClass,
              )}
            >
              {icon}
            </span>
            <span className="text-sm leading-relaxed text-slate-700">
              {renderItemText(item)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ServiceScopeList;
