import type { NavigationItem } from "./NavBar";
const navigationItems: NavigationItem[] = [
  { label: "Home", to: "/", type: "route" },
  {
    label: "Create",
    to: "/create",
    type: "route",
    allowedRoles: ["admin", "developer", "teacher"],
    requiresAuth: true,
  },
  {
    label: "QuestionBuilder",
    to: "/question_builder",
    type: "route",
    allowedRoles: ["admin", "developer", "teacher"],
    requiresAuth: true,
  },
  { label: "Questions", to: "/questions", type: "route" },
  { label: "Test", to: "/test", type: "route" },
];

export default navigationItems;
