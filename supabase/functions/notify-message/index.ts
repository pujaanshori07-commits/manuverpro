// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { record } = await req.json();
    const { match_id, sender_id, content } = record;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Fetch match row to identify recipient
    const matchRes = await fetch(`${supabaseUrl}/rest/v1/matches?id=eq.${match_id}&select=user_a_id,user_b_id`, {
      headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` },
    });
    const matches = await matchRes.json();
    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({ message: 'Match not found' }), { status: 200 });
    }

    const match = matches[0];
    const recipientId = match.user_a_id === sender_id ? match.user_b_id : match.user_a_id;

    // Fetch sender name and recipient push token
    const profilesRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=in.(${sender_id},${recipientId})&select=id,nama,push_token`, {
      headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` },
    });
    const profiles = await profilesRes.json();

    const sender = profiles.find((p: any) => p.id === sender_id);
    const recipient = profiles.find((p: any) => p.id === recipientId);

    if (!recipient?.push_token) {
      return new Response(JSON.stringify({ message: 'Recipient has no push token' }), { status: 200 });
    }

    const displayContent = content.startsWith('MVT_INVITE::') ? "Sent a game invite! ⚡️" : content;

    const pushMessage = {
      to: recipient.push_token,
      title: sender?.nama ? `${sender.nama} sent a message` : 'New Message',
      body: displayContent,
      data: { type: 'message', matchId: match_id },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([pushMessage]),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
