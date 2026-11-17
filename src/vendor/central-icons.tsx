/* Sustituto local de @central-icons-react/round-outlined-radius-2-stroke-2.
 * Central Icons es un pack de pago; estos son dibujos propios con el mismo
 * estilo (trazo 2, extremos redondeados) y la misma API (`size` + props SVG).
 * vite.config.ts redirige aquí cualquier import de ese paquete. */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

const make = (name: string, body: React.ReactNode) => {
  const Icon = ({ size = 24, ...props }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {body}
    </svg>
  );
  Icon.displayName = name;
  return Icon;
};

export const IconArrowBoxLeft = make(
  "IconArrowBoxLeft",
  <>
    <path d="M14 4h3a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-3" />
    <path d="M10 8l-4 4 4 4M6 12h9" />
  </>,
);
export const IconCheckmark1Small = make("IconCheckmark1Small", <path d="M7 12.5l3 3 7-7" />);
export const IconChevronDownSmall = make("IconChevronDownSmall", <path d="M8 10l4 4 4-4" />);
export const IconCrossSmall = make("IconCrossSmall", <path d="M8 8l8 8M16 8l-8 8" />);
export const IconEditBig = make(
  "IconEditBig",
  <>
    <path d="M11 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4" />
    <path d="M17.6 3.6a2 2 0 0 1 2.8 2.8L13 13.8l-3.5.7.7-3.5z" />
  </>,
);
export const IconHome = make(
  "IconHome",
  <>
    <path d="M4 10.2 12 4l8 6.2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M10 20v-5h4v5" />
  </>,
);
export const IconMagnifyingGlass = make(
  "IconMagnifyingGlass",
  <>
    <circle cx="11" cy="11" r="6" />
    <path d="M20 20l-4.2-4.2" />
  </>,
);
export const IconPlusMedium = make("IconPlusMedium", <path d="M12 6v12M6 12h12" />);
export const IconPopsicle2 = make(
  "IconPopsicle2",
  <>
    <path d="M8 15V8a4 4 0 0 1 8 0v7a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" />
    <path d="M12 16v5" />
  </>,
);
export const IconSettingsGear1 = make(
  "IconSettingsGear1",
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3l1.6 2.3 2.8-.5.5 2.8L19.2 9 18 11.6l1.2 2.6-2.3 1.6-.5 2.8-2.8-.5L12 21l-1.6-2.3-2.8.5-.5-2.8L4.8 15 6 12.4 4.8 9.8l2.3-1.6.5-2.8 2.8.5z" />
  </>,
);
export const IconSidebarLeftArrow = make(
  "IconSidebarLeftArrow",
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M9 4.5v15M15.5 10l-2 2 2 2" />
  </>,
);
export const IconUserAdd = make(
  "IconUserAdd",
  <>
    <circle cx="10" cy="8" r="3.5" />
    <path d="M3.5 19.5a6.5 6.5 0 0 1 11.2-4.5M18 14v6M15 17h6" />
  </>,
);
