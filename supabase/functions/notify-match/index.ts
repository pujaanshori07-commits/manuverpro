// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { record } = await req.json();
    const { user_a_id, user_b_id, id: matchId } = record;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=in.(${user_a_id},${user_b_id})&select=id,nama,push_token`, {
      headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` },
    });
    const profiles = await res.json();

    const userA = profiles.find((p: any) => p.id === user_a_id);
    const userB = profiles.find((p: any) => p.id === user_b_id);

    const messages = [];
    if (userA?.push_token) {
      messages.push({
        to: userA.push_token,
        title: "It's a Match! 🔥",
        body: `You and ${userB?.nama || 'a sports partner'} both want to play!`,
        data: { type: 'match', matchId },
      });
    }
    if (userB?.push_token) {
      messages.push({
        to: userB.push_token,
        title: "It's a Match! 🔥",
        body: `You and ${userA?.nama || 'a sports partner'} both want to play!`,
        data: { type: 'match', matchId },
      });
    }

    if (messages.length > 0) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });
    }

    return new Response(JSON.stringify({ success: true, count: messages.length }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
