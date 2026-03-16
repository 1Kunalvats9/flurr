const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');

const interactionsRouter = express.Router();

interactionsRouter.post('/', async (req, res) => {
  try {
    const { to_clerk_id, action } = req.body || {};

    if (!to_clerk_id || !action || !['like', 'pass'].includes(action)) {
      return res.status(400).json({ error: 'Invalid request. Required: to_clerk_id, action (like or pass)' });
    }

    if (to_clerk_id === req.userId) {
      return res.status(400).json({ error: 'You cannot interact with your own profile' });
    }

    const { error: interactionError } = await supabaseAdmin
      .from('interactions')
      .upsert(
        { from_clerk_id: req.userId, to_clerk_id, action },
        { onConflict: 'from_clerk_id,to_clerk_id' }
      );

    if (interactionError) return res.status(500).json({ error: interactionError.message });

    if (action === 'like') {
      const { data: mutualLike, error: mutualLikeError } = await supabaseAdmin
        .from('interactions')
        .select('id')
        .eq('from_clerk_id', to_clerk_id)
        .eq('to_clerk_id', req.userId)
        .eq('action', 'like')
        .maybeSingle();

      if (mutualLikeError) return res.status(500).json({ error: mutualLikeError.message });

      if (mutualLike) {
        const [userA, userB] = [req.userId, to_clerk_id].sort();

        const { error: matchError } = await supabaseAdmin
          .from('matches')
          .upsert(
            { user_a_clerk_id: userA, user_b_clerk_id: userB },
            { onConflict: 'user_a_clerk_id,user_b_clerk_id' }
          );

        if (matchError) return res.status(500).json({ error: matchError.message });

        return res.json({ match: true, message: 'Its a match' });
      }
    }

    return res.json({ match: false });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

interactionsRouter.get('/matches', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('matches')
      .select(`
        id,
        created_at,
        user_a_clerk_id,
        user_b_clerk_id
      `)
      .or(`user_a_clerk_id.eq.${req.userId},user_b_clerk_id.eq.${req.userId}`)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const enriched = await Promise.all(
      (data || []).map(async (match) => {
        const otherClerkId =
          match.user_a_clerk_id === req.userId
            ? match.user_b_clerk_id
            : match.user_a_clerk_id;

        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('clerk_id, name, pronouns, avatar_url')
          .eq('clerk_id', otherClerkId)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        return {
          match_id: match.id,
          matched_at: match.created_at,
          user: profile,
        };
      })
    );

    return res.json({ matches: enriched });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = { interactionsRouter };
