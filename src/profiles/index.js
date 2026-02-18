import { alpine } from "./alpine";
import { baseProfile as base } from "./base";
import { cadillac } from "./cadillac";

const PROFILES = { alpine, base, cadillac };

export function getProfile() {
  const id = import.meta.env.VITE_PROFILE || "base";
  return PROFILES[id] || PROFILES.base;
}
