interface ControlTowerHeroProps {
  owner: string;
  name: string;
}

export function ControlTowerHero({ owner, name }: ControlTowerHeroProps) {
  return (
    <section className="hud-panel hud-corner hud-scanline p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            ◢ Control Center
          </div>
          <h1 className="text-4xl font-semibold text-[var(--hud-text-bright)]">
            Delivery Control Tower
          </h1>
          <p className="max-w-3xl text-sm text-[var(--hud-text-dim)]">
            One view of how quickly we ship, where work is stalling, and which teammates need support.
            Built for the engineering manager to steer the Supabase platform team.
          </p>
        </div>
        <div className="min-w-[220px] rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-right">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            Viewing Repository
          </p>
          <p className="mt-2 font-mono text-sm text-[var(--hud-text-bright)]">
            {owner}/{name}
          </p>
        </div>
      </div>
    </section>
  );
}
