import { WSProvider } from "./ws/WSContext";
import ConnectionBar from "./components/ConnectionBar";
import PresetGrid from "./components/PresetGrid";
import ActivityLog from "./components/ActivityLog";

export default function Root() {
  return (
    <WSProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        <header className="border-b border-neutral-800">
          <ConnectionBar />
        </header>

        <main className="mx-auto max-w-6xl p-6 grid gap-6 md:grid-cols-3">
          <section className="md:col-span-2">
            <PresetGrid />
          </section>

          <aside>
            <ActivityLog />
          </aside>
        </main>

      </div>
    </WSProvider>
  );
}
