import { type UserRole } from "./types";

export type RoleDescription = {
  summary: string;
  capabilities: string[];
};

export const RoleDescriptions: Partial<Record<UserRole, RoleDescription>> = {
  admin: {
    summary: "Full platform access.",
    capabilities: [
      "Manage users, roles, and institutions",
      "Create, edit, and delete all question content",
      "Access and configure administrative platform settings",
    ],
  },
  developer: {
    summary: "Content builder with development tooling access.",
    capabilities: [
      "Create, edit, test, and organize questions",
      "Access developer workflows and tooling",
      "Practice and validate question behavior before release",
    ],
  },
  teacher: {
    summary: "Instructional access for course content management.",
    capabilities: [
      "Create and edit classroom question content",
      "Assign questions to learners",
      "Practice and review question behavior",
    ],
  },
  student: {
    summary: "Learner access for assigned content.",
    capabilities: [
      "View assigned questions",
      "Practice and submit responses",
      "Review available learning content",
    ],
  },
};
