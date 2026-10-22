import type { LabIconName } from "./icon-types";

export default function LabIcon({
  name,
  className = "h-5 w-5",
}: {
  name: LabIconName;
  className?: string;
}) {
  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    gauge: (
      <>
        <path d="M4.9 19a9 9 0 1 1 14.2 0M12 13l4-5M5 15h1M6.5 7.5l1 1M12 4v1M18.5 7.5l-1 1M18 15h1" />
        <circle cx="12" cy="14" r="1.5" />
      </>
    ),
    react: (
      <>
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
    next: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 16V8l9 12M16 8v6" />
      </>
    ),
    layers: (
      <path d="m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5" />
    ),
    book: (
      <path d="M4 3h13a2 2 0 0 1 2 2v16H5a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2ZM2 17h17M6 3v10M10 7h5M10 11h5" />
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7v.1" />
      </>
    ),
    code: <path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="7" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6" />,
    "arrow-up-right": <path d="M6 18 18 6M6 6h12v12" />,
    "chevron-right": <path d="m9 5 7 7-7 7" />,
    panel: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16M5.5 8h1M5.5 12h1" />
      </>
    ),
    github: (
      <path d="M9 19c-4.3 1.3-4.3-2-6-2.5M15 22v-3.5a3 3 0 0 0-.8-2.3c2.7-.3 5.6-1.3 5.6-6a4.7 4.7 0 0 0-1.3-3.3 4.4 4.4 0 0 0-.1-3.3s-1-.3-3.4 1.3a11.4 11.4 0 0 0-6 0C6.6 3.3 5.6 3.6 5.6 3.6a4.4 4.4 0 0 0-.1 3.3A4.7 4.7 0 0 0 4.2 10c0 4.7 2.9 5.7 5.6 6a3 3 0 0 0-.8 2.3V22" />
    ),
    flask: (
      <path d="M9 3h6M10 3v6l-6 10a1.3 1.3 0 0 0 1 2h14a1.3 1.3 0 0 0 1-2L14 9V3M7 15h10M10 18h.1M14 17h.1" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
