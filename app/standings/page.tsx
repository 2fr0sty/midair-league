export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSupabase } from "@/lib/supabaseClient";

export default async function StandingsPage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const supabase = getSupabase();

  // TEMP (testing only): which team am I
  const myTeamId = searchParams?.myTeamId || "";

  // Active season
  const { data: seasons, error: seasonErr } = await supabase
    .from("seasons")
    .select("id,name,active")
    .eq("active", true)
    .limit(1);

  const activeSeason = seasons?.[0];

  if (seasonErr) {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Standings</h1>
        <p>Error loading season: {seasonErr.message}</p>
      </main>
    );
  }

  if (!activeSeason) {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Standings</h1>
        <p>No active season found. Create one in Supabase.</p>
      </main>
    );
  }

  // All teams (for My Team dropdown)
  const { data: allTeams, error: teamsErr } = await supabase
    .from("teams")
    .select("id,name,tag")
    .order("name", { ascending: true });

  const teamsForPicker =
    allTeams?.map((t: any) => ({
      id: t.id,
      name: t.name,
      tag: t.tag,
    })) ?? [];

  // Standings rows
  const { data: standings, error: standingsErr } = await supabase
    .from("season_teams")
    .select("points,wins,losses,flag_diff, team_id, teams(name,tag)")
    .eq("season_id", activeSeason.id)
    .order("points", { ascending: false })
    .order("flag_diff", { ascending: false });

  // Upcoming matches for the season (to show next match under team names)
  const nowIso = new Date().toISOString();
  const { data: upcomingMatches, error: upcomingErr } = await supabase
    .from("matches")
    .select("id, scheduled_at, home_team, away_team")
    .eq("season_id", activeSeason.id)
    .gte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true });

  function nextMatchText(teamId: string) {
    if (upcomingErr) return `Error loading matches: ${upcomingErr.message}`;
    if (!upcomingMatches || upcomingMatches.length === 0)
      return "No upcoming matches in league";

    const m = upcomingMatches.find(
      (x: any) => x.home_team === teamId || x.away_team === teamId
    );

    if (!m?.scheduled_at) return "No match scheduled";
    return `Next match: ${new Date(m.scheduled_at).toLocaleString()}`;
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Standings</h1>
      <p style={{ marginTop: 6 }}>
        Active season: <b>{activeSeason.name}</b>
      </p>

      <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/matches" style={{ textDecoration: "underline" }}>
          Matches
        </Link>
        <Link href="/challenges" style={{ textDecoration: "underline" }}>
          Challenges
        </Link>
        <Link href="/league-status" style={{ textDecoration: "underline" }}>
          League Status
        </Link>
      </div>

      {/* MY TEAM PICKER */}
      <section
        style={{
          marginTop: 16,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Testing: Select “My Team”
        </h2>

        {teamsErr ? (
          <p>Error loading teams: {teamsErr.message}</p>
        ) : (
          <form
            method="get"
            action="/standings"
            style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}
          >
            <select name="myTeamId" defaultValue={myTeamId} style={{ padding: 8 }}>
              <option value="">-- Select your team --</option>
              {teamsForPicker.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.tag})
                </option>
              ))}
            </select>

            <button type="submit" style={btn}>
              Set My Team
            </button>

            {myTeamId ? (
              <span style={{ opacity: 0.7 }}>
                Selected: <code>{myTeamId.slice(0, 8)}</code>
              </span>
            ) : (
              <span style={{ opacity: 0.7 }}>Pick a team so Challenge works</span>
            )}
          </form>
        )}
      </section>

      {/* STANDINGS TABLE */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Teams</h2>

        {standingsErr ? (
          <p style={{ marginTop: 8 }}>Error loading standings: {standingsErr.message}</p>
        ) : !standings?.length ? (
          <p style={{ marginTop: 8 }}>
            No teams in this season yet. Seed teams into season_teams.
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
              {standings.map((row: any, idx: number) => {
                const disableChallenge = !myTeamId || myTeamId === row.team_id;

                return (
                  <tr key={row.team_id}>
                    <td style={td}>{idx + 1}</td>

                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>
                        {row.teams?.name} ({row.teams?.tag})
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                        {nextMatchText(row.team_id)}
                      </div>
                    </td>

                    <td style={td}>{row.wins}</td>
                    <td style={td}>{row.losses}</td>
                    <td style={td}>{row.points}</td>
                    <td style={td}>{row.flag_diff}</td>

                    <td style={td}>
                      <form action="/api/challenges/create" method="post">
                        <input type="hidden" name="seasonId" value={activeSeason.id} />
                        <input type="hidden" name="defenderTeamId" value={row.team_id} />
                        <input type="hidden" name="challengerTeamId" value={myTeamId} />

                        <button style={btn} type="submit" disabled={disableChallenge}>
                          Challenge
                        </button>

                        {!myTeamId && (
                          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                            Select “My Team” above
                          </div>
                        )}
                        {myTeamId === row.team_id && (
                          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                            Can’t challenge yourself
                          </div>
                        )}
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

const btn: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #333",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
};

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "8px",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px",
};

