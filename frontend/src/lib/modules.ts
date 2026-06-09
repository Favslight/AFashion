import { adminModules, userModules } from "@/data/backendRoutes";

export function userModule(title: string) {
  const module = userModules.find((item) => item.title === title);

  if (!module) {
    throw new Error(`Unknown user module: ${title}`);
  }

  return module;
}

export function adminModule(title: string) {
  const module = adminModules.find((item) => item.title === title);

  if (!module) {
    throw new Error(`Unknown admin module: ${title}`);
  }

  return module;
}
