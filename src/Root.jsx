import { getProfile } from "./profiles";
import { useEffect } from "react";
import ControlPanel from "./components/ControlPanel";
import ActivityLog from "./components/ActivityLog";
import { SimpleWSProvider } from "./ws/SimpleWSContext";

export default function Root() {
  const profile = getProfile();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", profile.ui.colors.primary);
    root.style.setProperty("--secondary", profile.ui.colors.secondary);
    root.style.setProperty("--tertiary", profile.ui.colors.tertiary);
    root.style.setProperty("--text", profile.ui.colors.text);
    root.style.setProperty("--orgName", profile.brand.orgName);
  }, [profile]);

  return (
    <SimpleWSProvider>
      <div
        className="relative min-h-screen overflow-hidden bg-[var(--primary)] text-[var(--text)]"
        style={{ fontFamily: profile.ui.typography?.fontFamily }}
      >
        <img
          src={profile.brand.assets.logo}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 w-72 md:w-96 lg:w-[40rem] -translate-x-1/2 -translate-y-1/2 opacity-10"
        />

        <main className="relative z-10 mx-auto max-w-6xl p-6 grid gap-6 md:grid-cols-3">
          <section className="md:col-span-2">
            <ControlPanel />
          </section>
          <aside>
            <ActivityLog />
          </aside>
        </main>
      </div>
    </SimpleWSProvider>
  );
}