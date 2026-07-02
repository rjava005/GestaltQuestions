import clsx from "clsx";
import type { IconType } from "react-icons";
type HeaderProps = {
  title: string;
  Icon?: IconType;
  isOpen: boolean;
  toggle: () => void;
};

const toggleButtonStyles = {
  open: "border-border-strong bg-surface-strong text-text hover:bg-surface-muted",
  closed: "border-transparent bg-accent text-bg hover:bg-accent-strong",
};

const toggleIconStyles = {
  open: "rotate-90 scale-100",
  closed: "rotate-0 scale-95",
};
// TODO how to improve this style such that i can better control how the icon renders on open and how it should look like on close
export default function SideBarHeader({
  title,
  Icon,
  isOpen,
  toggle,
}: HeaderProps) {
  const sidebarState = isOpen ? "open" : "closed";
  return (
    <div className="flex flex-row items-center justify-start gap-2">
      {isOpen && (
        <span className="min-w-0 text-xl truncate pl-4  font-semibold tracking-wide text-text">
          {title}
        </span>
      )}
      {Icon && (
        <div className="flex justify-end grow">
          <button
            type="button"
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isOpen}
            onClick={toggle}
            className={clsx(
              "m-3 flex h-10 w-10 items-center justify-center rounded-md border transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-accent/60",
              toggleButtonStyles[sidebarState],
            )}
          >
            <Icon
              size={22}
              className={clsx(
                "transition-transform duration-200",
                toggleIconStyles[sidebarState],
              )}
            />
          </button>
        </div>
      )}
    </div>
  );
}
