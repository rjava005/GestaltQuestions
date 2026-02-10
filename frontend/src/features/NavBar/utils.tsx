import type { UserRole } from "../../types/userTypes";
import type { NavigationItem } from "./types";
import type { User } from "firebase/auth";
import { Route } from "react-router-dom";

export function canAccessRoute(
  nav: NavigationItem,
  user: User | null,
  userRole: UserRole
) {
  if (nav.requiresAuth && !user) return false;

  // Route has role restrictions
  if (nav.allowedRoles && nav.allowedRoles.length > 0) {
    if (!userRole) return false;
    return nav.allowedRoles.includes(userRole);
  }

  // Public OR only requires login
  return true;
}
export function handleRoutes(navigation: NavigationItem[]) {
  return navigation.map((nav) => {
    // Simple route
    if (!nav.items || nav.items.length === 0) {
      return (
        <Route
          key={nav.path}
          path={nav.path}
          element={nav.element}
        />
      );
    }

    // Route with children
    return (
      <Route
        key={nav.path}
        path={nav.path}
        element={nav.element}
      >
        {nav.items.map((child) => (
          <Route
            key={child.path}
            path={child.path.replace(`${nav.path}/`, "")}
            element={child.element}
          />
        ))}
      </Route>
    );
  });
}
