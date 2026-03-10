const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');

const usersRouter = express.Router();

usersRouter.get('/me', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(
      `
      id,
      clerk_id,
      name,
      pronouns,
      email,
      avatar_url,
      era,
      onboarding_complete,
      created_at,
      preferences (
        intentions,
        match_types,
        updated_at
      )
    `
    )
    .eq('clerk_id', req.userId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.json({ exists: false });
  }

  const preferences = Array.isArray(data.preferences) ? data.preferences[0] || null : data.preferences || null;

  return res.json({
    exists: true,
    profile: {
      id: data.id,
      clerk_id: data.clerk_id,
      name: data.name,
      pronouns: data.pronouns,
      email: data.email,
      avatar_url: data.avatar_url,
      era: data.era,
      onboarding_complete: data.onboarding_complete,
      created_at: data.created_at,
    },
    preferences,
  });
});

usersRouter.post('/profile', async (req, res) => {
  const { name, pronouns, email } = req.body || {};

  if (typeof name !== 'string' || name.trim().length < 1) {
    return res.status(400).json({ error: 'name is required' });
  }

  if (typeof pronouns !== 'string' || pronouns.trim().length < 1) {
    return res.status(400).json({ error: 'pronouns is required' });
  }

  if (typeof email !== 'string' || email.trim().length < 1) {
    return res.status(400).json({ error: 'email is required' });
  }

  const payload = {
    clerk_id: req.userId,
    name: name.trim(),
    pronouns: pronouns.trim(),
    email: email.trim().toLowerCase(),
  };

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(payload, {
      onConflict: 'clerk_id',
    })
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ profile: data });
});

usersRouter.post('/preferences', async (req, res) => {
  const { intentions, match_types: matchTypes, era } = req.body || {};

  if (!Array.isArray(intentions) || intentions.length === 0) {
    return res.status(400).json({ error: 'intentions must be a non-empty array' });
  }

  if (!Array.isArray(matchTypes) || matchTypes.length === 0) {
    return res.status(400).json({ error: 'match_types must be a non-empty array' });
  }

  const numericEra = Number(era);
  if (!Number.isFinite(numericEra)) {
    return res.status(400).json({ error: 'era must be a number' });
  }

  const cleanedIntentions = intentions.filter((value) => typeof value === 'string').map((value) => value.trim());
  const cleanedMatchTypes = matchTypes.filter((value) => typeof value === 'string').map((value) => value.trim());

  const { data: preferencesData, error: preferencesError } = await supabaseAdmin
    .from('preferences')
    .upsert(
      {
        clerk_id: req.userId,
        intentions: cleanedIntentions,
        match_types: cleanedMatchTypes,
      },
      {
        onConflict: 'clerk_id',
      }
    )
    .select('*')
    .single();

  if (preferencesError) {
    return res.status(500).json({ error: preferencesError.message });
  }

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        clerk_id: req.userId,
        era: numericEra,
        onboarding_complete: true,
      },
      {
        onConflict: 'clerk_id',
      }
    )
    .select('*')
    .single();

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  return res.json({
    profile: profileData,
    preferences: preferencesData,
  });
});

module.exports = { usersRouter };
