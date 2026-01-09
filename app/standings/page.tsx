export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSupabase } from "@/lib/supabaseClient";

export default async function StandingsPage() {
  const supabase = getSupabase();

  // Get active season
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id,name,active")
    .eq("active", true)
    .limit(1);

  const activeSeason = seasons?.[0];

  if (!activeSeason) {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Standings</h1>
        <p>No active season found. Create one in Supabase.</p>
      </main>
    );
  }

  // Standings (teams in season_teams ordered by points)
  const { data: standings } = await supabase
    .from("season_teams")
    .select("points,wins,losses,flag_diff, team_id, teams(name,tag)")
    .eq("season_id", activeSeason.id)
    .order("points", { ascending: false })
    .order("flag_diff", { ascending: false });

  // Recent challenges in this season
  const { data: challenges } = await supabase
    .from("team_challenges")
    .select("id,status,created_at, challenger_team_id, defender_team_id")
    .eq("season_id", activeSeason.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Standings</h1>
      <p style={{ marginTop: 6 }}>
        Active season: <b>{activeSeason.name}</b>
      </p>

      <div style={{ marginTop: 18, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/challenges" style={{ textDecoration: "underline" }}>
          Go to Challenges Inbox
        </Link>
        <Link href="/league-status" style={{ textDecoration: "underline" }}>
          League Status
        </Link>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Teams</h2>

        {!standings?.length ? (
          <p style={{ marginTop: 8 }}>
            No teams added to this season yet. (Next we’ll build team creation.)
          </p>
        ) : (
          <table style={{ marginTop: 10, borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Team</th>
                <th style={th}>W</th>
                <th style={th}>L</th>
                <th style={th}>Pts</th>
                <th style={th}>Flag Diff</th>
                <th style={th}>Challenge</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row: any, idx: number) => (
                <tr key={row.team_id}>
                  <td style={td}>{idx + 1}</td>
                  <td style={td}>
                    {row.teams?.name} <span style={{ opacity: 0.7 }}>({row.teams?.tag})</span>
                  </td>
                  <td style={td}>{row.wins}</td>
                  <td style={td}>{row.losses}</td>
                  <td style={td}>{row.points}</td>
                  <td style={td}>{row.flag_diff}</td>
                  <td style={td}>
                    <form action="/api/challenges/create" method="post">
                      <input type="hidden" name="seasonId" value={activeSeason.id} />
                      <input type="hidden" name="defenderTeamId" value={row.team_id} />
                      <button style={btn} type="submit">Challenge</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Recent Challenges</h2>
        {!challenges?.length ? (
          <p style={{ marginTop: 8 }}>No challenges yet.</p>
        ) : (
          <ul style={{ marginTop: 10 }}>
            {challenges.map((c: any) => (
              <li key={c.id} style={{ marginBottom: 8 }}>
                <code>{c.id.slice(0, 8)}</code> — <b>{c.status}</b> —{" "}
                {new Date(c.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "8px",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px",
};

const btn: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #333",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
};
