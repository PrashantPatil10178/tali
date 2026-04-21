import { NavGroup } from "@/types";

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/overview",
        icon: "dashboard",
        isActive: false,
        shortcut: ["d", "d"],
        items: [],
      },
      {
        title: "Students",
        url: "/dashboard/students",
        icon: "teams",
        shortcut: ["s", "s"],
        isActive: false,
        items: [],
      },
      {
        title: "Attendance",
        url: "/dashboard/attendance",
        icon: "kanban",
        shortcut: ["a", "a"],
        isActive: false,
        items: [],
      },
      {
        title: "Homework",
        url: "/dashboard/homework",
        icon: "forms",
        shortcut: ["h", "h"],
        isActive: false,
        items: [],
      },
      {
        title: "Scan",
        url: "/dashboard/scan",
        icon: "billing",
        shortcut: ["s", "c"],
        isActive: false,
        items: [],
      },
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: "product",
        shortcut: ["r", "r"],
        isActive: false,
        items: [],
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: "profile",
        shortcut: ["m", "m"],
      },
      {
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: "notification",
        shortcut: ["n", "n"],
      },
      {
        title: "Login",
        shortcut: ["l", "l"],
        url: "/",
        icon: "login",
      },
    ],
  },
];
