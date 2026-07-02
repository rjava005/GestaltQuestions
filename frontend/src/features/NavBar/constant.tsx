import type { NavigationItem } from "./NavBar";
const navigationItems: NavigationItem[] = [
  { label: "Home", to: "/", type: "route" },
  {
    label: "QuestionBuilder",
    to: "/question_builder",
    type: "route",
    allowedRoles: ["developer", "teacher"],
    requiresAuth: true,
  },
  { label: "Questions", to: "/questions", type: "route" },
];

export default navigationItems;
