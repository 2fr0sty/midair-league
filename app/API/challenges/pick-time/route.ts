import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const form = await req.formData();
  const challengeId = String(form.get("challengeId") || "");
  const timeOptionId = String(form.get("timeOptionId") || "");

  if (!challengeId || !timeOptionId) {
    return NextResponse.json({ error: "Missing challengeId/timeOptionId" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Load challenge + time
  const { data: challenge, error: cErr } = await supabase
    .from("team_challenges")
    .select("id,season_id,division_id,challenger_team_id,defender_team_id")
    .eq("id", challengeId)
    .single();

  if (cErr || !challenge) return NextResponse.json({ error: cErr?.message ?? "Challenge not found" }, { status: 404 });

  const { data: option, error: oErr } = await supabase
    .from("challenge_time_options")
    .select("id,proposed_at")
    .eq("id", timeOptionId)
    .single();

  if (oErr || !option) return NextResponse.json({ error: oErr?.message ?? "Time option not found" }, { status: 404 });

  // Create match using chosen time
  const { data: match, error: mErr } = await supabase
    .from("matches")
    .insert({
      season_id: challenge.season_id,
      division_id: challenge.division_id,
      home_team: challenge.defender_team_id,
      away_team: challenge.challenger_team_id,
      scheduled_at: option.proposed_at,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (mErr || !match) return NextResponse.json({ error: mErr?.message ?? "Match create failed" }, { status: 500 });

  // Update challenge to scheduled + link match
  const { error: uErr } = await supabase.from("team_challenges").update({
    status: "scheduled",
    selected_time_option_id: option.id,
    match_id: match.id
  }).eq("id", challengeId);

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.redirect(new URL(`/challenges?challenge=${challengeId}`, req.url));
}
