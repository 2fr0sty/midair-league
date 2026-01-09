import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const form = await req.formData();
  const seasonId = String(form.get("seasonId") || "");
  const defenderTeamId = String(form.get("defenderTeamId") || "");

  // NOTE: For now, we don’t know who the challenger is (auth comes next),
  // so we’ll require a temporary placeholder.
  // In the next step, we’ll replace this with “your team” via Discord login.
  const challengerTeamId = String(form.get("challengerTeamId") || "");

  if (!seasonId || !defenderTeamId || !challengerTeamId) {
    return NextResponse.json(
      { error: "Missing seasonId/defenderTeamId/challengerTeamId" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Find division for defender in this season (simplest: use defender’s season_teams row)
  const { data: st } = await supabase
    .from("season_teams")
    .select("division_id")
    .eq("season_id", seasonId)
    .eq("team_id", defenderTeamId)
    .limit(1);

  const divisionId = st?.[0]?.division_id;
  if (!divisionId) {
    return NextResponse.json(
      { error: "Defender team is not placed in this season_teams table yet." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.from("team_challenges").insert({
    season_id: seasonId,
    division_id: divisionId,
    challenger_team_id: challengerTeamId,
    defender_team_id: defenderTeamId,
    status: "requested",
  }).select("id").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL(`/challenges?challenge=${data.id}`, req.url));
}
