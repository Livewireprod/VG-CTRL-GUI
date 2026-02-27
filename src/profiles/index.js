import { alpine } from "./alpine";
import { baseProfile as base } from "./base";
import { cadillac } from "./cadillac";
import { mercedes } from "./mercedes";

const PROFILES = { alpine, base, cadillac, mercedes };

export function getProfile() {
  const id = import.meta.env.VITE_PROFILE || "base";
  return PROFILES[id] || PROFILES.base;
}
