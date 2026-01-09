import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabaseClient";

function parseLocalDateTime(s: string) {
  // expects "YYYY-MM-DDTHH:MM"
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function POST(req: Request) {
  const form = await req.formData();
  const challengeId = String(form.get("challengeId") || "");
  const t1 = String(form.get("t1") || "").trim();
  const t2 = String(form.get("t2") || "").trim();
  const t3 = String(form.get("t3") || "").trim();

  if (!challengeId || !t1 || !t2 || !t3) {
    return NextResponse.json({ error: "Need challengeId and 3 times" }, { status: 400 });
  }

  const iso1 = parseLocalDateTime(t1);
  const iso2 = parseLocalDateTime(t2);
  const iso3 = parseLocalDateTime(t3);

  if (!iso1 || !iso2 || !iso3) {
    return NextResponse.json({ error: "One of the times is invalid. Use YYYY-MM-DDTHH:MM" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Insert options
  const { error } = await supabase.from("challenge_time_options").insert([
    { challenge_id: challengeId, proposed_at: iso1 },
    { challenge_id: challengeId, proposed_at: iso2 },
    { challenge_id: challengeId, proposed_at: iso3 },
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update status
  await supabase.from("team_challenges")
    .update({ status: "times_proposed" })
    .eq("id", challengeId);

  return NextResponse.redirect(new URL(`/challenges?challenge=${challengeId}`, req.url));
}
