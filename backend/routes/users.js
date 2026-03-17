const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');

const usersRouter = express.Router();

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

usersRouter.get('/me', async (req, res) => {
  const { data: authUser, error: authUserError } = await supabaseAdmin
    .from('auth_users')
    .select('id, email')
    .eq('id', req.userId)
    .maybeSingle();

  if (authUserError) {
    return res.status(500).json({ error: authUserError.message });
  }

  if (!authUser) {
    return res.json({ exists: false });
  }

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
        is_bipoc,
        presentation,
        presentation_preferences,
        archetype,
        archetype_preferences,
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
    return res.json({
      exists: true,
      profile: {
        clerk_id: authUser.id,
        name: '',
        pronouns: '',
        email: authUser.email,
        avatar_url: null,
        era: 50,
        onboarding_complete: false,
      },
      preferences: null,
    });
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
  const {
    intentions,
    match_types,
    era,
    is_bipoc,
    presentation,
    presentation_preferences,
    archetype,
    archetype_preferences,
  } = req.body || {};

  if (!Array.isArray(intentions) || intentions.length === 0) {
    return res.status(400).json({ error: 'intentions must be a non-empty array' });
  }

  if (!Array.isArray(match_types) || match_types.length === 0) {
    return res.status(400).json({ error: 'match_types must be a non-empty array' });
  }

  const numericEra = Number(era);
  if (!Number.isFinite(numericEra)) {
    return res.status(400).json({ error: 'era must be a number' });
  }

  if (is_bipoc !== null && is_bipoc !== undefined && typeof is_bipoc !== 'boolean') {
    return res.status(400).json({ error: 'is_bipoc must be a boolean or null' });
  }

  const cleanedIntentions = normalizeStringArray(intentions);
  const cleanedMatchTypes = normalizeStringArray(match_types);
  const cleanedPresentationPreferences = normalizeStringArray(presentation_preferences);
  const cleanedArchetypePreferences = normalizeStringArray(archetype_preferences);

  const { data: preferencesData, error: preferencesError } = await supabaseAdmin
    .from('preferences')
    .upsert(
      {
        clerk_id: req.userId,
        intentions: cleanedIntentions,
        match_types: cleanedMatchTypes,
        is_bipoc: is_bipoc ?? null,
        presentation: normalizeOptionalString(presentation),
        presentation_preferences: cleanedPresentationPreferences,
        archetype: normalizeOptionalString(archetype),
        archetype_preferences: cleanedArchetypePreferences,
        updated_at: new Date().toISOString(),
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
    .update({
      era: numericEra || 50,
      onboarding_complete: true,
    })
    .eq('clerk_id', req.userId)
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
