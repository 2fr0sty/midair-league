export const dynamic = "force-dynamic";

import { getSupabase } from "@/lib/supabaseClient";

export default async function ChallengesPage() {
  const supabase = getSupabase();

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id,name,active")
    .eq("active", true)
    .limit(1);

  const activeSeason = seasons?.[0];
  if (!activeSeason) {
    return <main style={{ padding: 24 }}>No active season.</main>;
  }

  const { data: challenges } = await supabase
    .from("team_challenges")
    .select(`
      id,status,created_at,season_id,division_id,
      challenger_team_id, defender_team_id,
      selected_time_option_id, match_id
    `)
    .eq("season_id", activeSeason.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Challenges Inbox</h1>
      <p style={{ marginTop: 6 }}>Active season: <b>{activeSeason.name}</b></p>

      {!challenges?.length ? (
        <p style={{ marginTop: 12 }}>No challenges yet.</p>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
          {challenges.map((c: any) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      )}
    </main>
  );
}

async function ChallengeCard({ challenge }: any) {
  const supabase = getSupabase();

  const { data: times } = await supabase
    .from("challenge_time_options")
    .select("id,proposed_at")
    .eq("challenge_id", challenge.id)
    .order("proposed_at", { ascending: true });

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div><b>Challenge:</b> <code>{challenge.id.slice(0, 8)}</code></div>
          <div><b>Status:</b> {challenge.status}</div>
        </div>
        <div style={{ opacity: 0.7 }}>
          {new Date(challenge.created_at).toLocaleString()}
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <b>Proposed Times:</b>
        {times?.length ? (
          <ul style={{ marginTop: 6 }}>
            {times.map((t: any) => (
              <li key={t.id}>
                {new Date(t.proposed_at).toLocaleString()}
                {" "}
                <form action="/api/challenges/pick-time" method="post" style={{ display: "inline" }}>
                  <input type="hidden" name="challengeId" value={challenge.id} />
                  <input type="hidden" name="timeOptionId" value={t.id} />
                  <button style={smallBtn} type="submit">Pick this time</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ marginTop: 6 }}>No times proposed yet.</p>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <b>Defender: propose 3 times</b>
        <p style={{ marginTop: 6, opacity: 0.75 }}>
          Enter 3 date/times (example: 2026-01-12T20:00)
        </p>

        <form action="/api/challenges/propose-times" method="post" style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <input type="hidden" name="challengeId" value={challenge.id} />
          <input name="t1" placeholder="YYYY-MM-DDTHH:MM" />
          <input name="t2" placeholder="YYYY-MM-DDTHH:MM" />
          <input name="t3" placeholder="YYYY-MM-DDTHH:MM" />
          <button style={btn} type="submit">Submit 3 times</button>
        </form>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #333",
  borderRadius: 8,
  background: "white",
  cursor: "pointer",
};

const smallBtn: React.CSSProperties = {
  marginLeft: 10,
  padding: "4px 8px",
  border: "1px solid #333",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
  fontSize: 12,
};
