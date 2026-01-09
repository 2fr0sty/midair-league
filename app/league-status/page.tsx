import { supabase } from "@/lib/supabaseClient";

export default async function LeagueStatusPage() {
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id,name,active,start_date,end_date")
    .order("start_date", { ascending: false });

  const activeSeason = seasons?.find((s) => s.active);

  const { count: teamsCount } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true });

  const { count: freeAgentsCount } = await supabase
    .from("free_agents")
    .select("*", { count: "exact", head: true });

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        Midair League – Status
      </h1>

      <section style={{ marginTop: 16 }}>
        <h2>Active Season</h2>
        {activeSeason ? (
          <p>
            {activeSeason.name} ({activeSeason.start_date ?? "?"} →{" "}
            {activeSeason.end_date ?? "?"})
          </p>
        ) : (
          <p>No active season yet</p>
        )}
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>Totals</h2>
        <ul>
          <li>Teams: {teamsCount ?? 0}</li>
          <li>Free Agents: {freeAgentsCount ?? 0}</li>
        </ul>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2>All Seasons</h2>
        <ul>
          {(seasons ?? []).map((s) => (
            <li key={s.id}>
              {s.name} {s.active ? "(active)" : ""}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
