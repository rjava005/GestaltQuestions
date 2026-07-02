import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { type User } from "firebase/auth";
import { Link, NavLink } from "react-router-dom";

import { useAuth, type UserRole } from "../Auth";
import { ThemeToggle } from "../ThemeToggle";

type Base = {
  label: string;
  to: string;
  requiresAuth?: boolean;
  allowedRoles?: UserRole[];
};

export type BaseRoute = Base & {
  type: "route";
  items?: Base[];
};

export type DropDownNavRoute = Base & {
  type: "dropdown";
  items: Base[];
};

export type NavigationItem = BaseRoute | DropDownNavRoute;

interface NavBarProps {
  items: NavigationItem[];
}

/* Shared view-switcher styles (topbar-actions / view-switcher / view-pill) */
const styles = {
  topbarActions: "flex items-center gap-4",
  viewSwitcher: clsx(
    "flex items-center gap-2.5 p-2 rounded-full border",
    "border-border bg-surface backdrop-blur-[18px]",
  ),
  viewPillBase: clsx(
    "px-4 py-2.5 rounded-full",
    "transition-colors duration-200",
    "text-text-muted hover:text-text",
  ),
  viewPillActive: "bg-surface-strong text-text",
  viewPillInactive: "bg-transparent",
  menuPanel: clsx(
    "absolute left-0 mt-2 w-44 rounded-2xl border p-1 shadow-soft",
    "border-border bg-surface text-text backdrop-blur-md focus:outline-none",
  ),
  rightAction: clsx(
    "rounded-md px-3 py-2 text-sm font-medium",
    "text-text-muted transition hover:bg-surface-muted hover:text-text",
  ),
};

export function canAccessRoute(
  nav: NavigationItem,
  user: User | null,
  userRole: UserRole[], // Actual role of the user
): boolean {
  if (nav.requiresAuth && !user) return false;

  // Route has role restrictions
  if (nav.allowedRoles && nav.allowedRoles.length > 0) {
    if (!userRole) return false;
    return nav.allowedRoles.some((role) => userRole.includes(role));
  }
  // Public OR only requires login
  return true;
}

function routePillClassName(isActive: boolean) {
  return clsx(
    styles.viewPillBase,
    isActive ? styles.viewPillActive : styles.viewPillInactive,
  );
}

function RoutePill({ to, label }: Base) {
  return (
    <NavLink to={to} className={({ isActive }) => routePillClassName(isActive)}>
      {label}
    </NavLink>
  );
}

function DropDownNav({ nav }: { nav: DropDownNavRoute }) {
  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={clsx(
          styles.viewPillBase,
          styles.viewPillInactive,
          "inline-flex items-center gap-1.5",
        )}
      >
        <span>{nav.label}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </MenuButton>

      <MenuItems className={styles.menuPanel}>
        {nav.items.map((child) => (
          <MenuItem key={child.to}>
            {({ focus }) => (
              <Link
                to={child.to}
                className={clsx(
                  "block rounded-xl px-3 py-2 text-sm transition-colors",
                  focus ? "bg-surface-strong text-text" : "text-text-muted",
                )}
              >
                {child.label}
              </Link>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}

function NavBar({ items }: NavBarProps) {
  const { user, logout, userData } = useAuth();
  const role = userData?.roles ?? [];

  const visibleItems = items.filter((item) => canAccessRoute(item, user, role));

  return (
    <Disclosure
      as="nav"
      className="border-b border-border bg-surface text-text backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center px-3 sm:px-6 lg:px-8">
        <div className="sm:hidden">
          <DisclosureButton
            className="group inline-flex items-center justify-center rounded-md p-2 text-text-muted transition hover:bg-surface-muted hover:text-text"
            aria-label="Toggle navigation menu"
          >
            <Bars3Icon className="block h-6 w-6 group-data-open:hidden" />
            <XMarkIcon className="hidden h-6 w-6 group-data-open:block" />
          </DisclosureButton>
        </div>

        <div className="hidden sm:block">
          <div className={styles.topbarActions}>
            <nav className={styles.viewSwitcher} aria-label="Primary views">
              {visibleItems.map((item) =>
                item.type === "dropdown" ? (
                  <DropDownNav key={item.label} nav={item} />
                ) : (
                  <RoutePill key={item.to} to={item.to} label={item.label} />
                ),
              )}
            </nav>
          </div>
        </div>
        {/* Container for login and signup */}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link to="/account">My Account</Link>
              <button
                type="button"
                onClick={logout}
                className={styles.rightAction}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className={styles.rightAction}>
              Sign Up / Log In
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>

      <DisclosurePanel className="border-t border-border bg-surface sm:hidden">
        <div className="space-y-1 px-3 py-3">
          {visibleItems.map((item) => {
            if (item.type !== "route") return null;

            return (
              <DisclosureButton
                key={item.to}
                as={Link}
                to={item.to}
                className="block rounded-md px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-surface-muted hover:text-text"
              >
                {item.label}
              </DisclosureButton>
            );
          })}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}

export default NavBar;
