import type React from "react";
import type { AllowedRoles } from "../../types/userTypes";

export type Base = {
  path: string;
  element: React.ReactNode;
  includeNavBar?: boolean;
  displayName: string;
  allowedRoles?: AllowedRoles;
  requiresAuth?: boolean;
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
