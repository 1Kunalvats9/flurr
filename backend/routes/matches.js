const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { calculateCompatibility } = require('../utils/matching');

const matchesRouter = express.Router();

function unwrapPreference(preferences) {
  if (Array.isArray(preferences)) {
    return preferences[0] || null;
  }

  return preferences || null;
}

function getStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

function resolveEraGroup(era) {
  const numericEra = Number(era);

  if (numericEra <= 37) {
    return 'gen_z';
  }

  if (numericEra <= 62) {
    return 'zillenial';
  }

  return 'millennial';
}

matchesRouter.get('/', async (req, res) => {
  const { data: currentProfile, error: currentProfileError } = await supabaseAdmin
    .from('profiles')
    .select('clerk_id, era')
    .eq('clerk_id', req.userId)
    .maybeSingle();

  if (currentProfileError) {
    return res.status(500).json({ error: currentProfileError.message });
  }

  const { data: currentPreferences, error: currentPreferencesError } = await supabaseAdmin
    .from('preferences')
    .select('intentions, match_types')
    .eq('clerk_id', req.userId)
    .maybeSingle();

  if (currentPreferencesError) {
    return res.status(500).json({ error: currentPreferencesError.message });
  }

  if (!currentProfile || !currentPreferences) {
    return res.json({ matches: [] });
  }

  const currentUser = {
    intentions: getStringArray(currentPreferences.intentions),
    match_types: getStringArray(currentPreferences.match_types),
    era: Number(currentProfile.era) || 50,
  };
  const currentUserEraGroup = resolveEraGroup(currentUser.era);

  const { data: candidates, error: candidatesError } = await supabaseAdmin
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
      preferences (
        intentions,
        match_types
      )
    `
    )
    .neq('clerk_id', req.userId)
    .eq('onboarding_complete', true);

  if (candidatesError) {
    return res.status(500).json({ error: candidatesError.message });
  }

  const matches = (candidates || [])
    .map((candidate) => {
      const candidatePreferences = unwrapPreference(candidate.preferences);

      const normalizedCandidate = {
        intentions: getStringArray(candidatePreferences?.intentions),
        match_types: getStringArray(candidatePreferences?.match_types),
        era: Number(candidate.era) || 50,
      };
      const candidateEraGroup = resolveEraGroup(normalizedCandidate.era);

      const intentionOverlap = currentUser.intentions.filter((i) => normalizedCandidate.intentions.includes(i)).length;
      const matchTypeOverlap = currentUser.match_types.filter((m) => normalizedCandidate.match_types.includes(m)).length;

      // Keep feed focused on actual preference matches.
      if (intentionOverlap === 0 && matchTypeOverlap === 0) {
        return null;
      }

      // Keep matches within the same age/era group.
      if (candidateEraGroup !== currentUserEraGroup) {
        return null;
      }

      const compatibility_score = calculateCompatibility(currentUser, normalizedCandidate);

      return {
        id: candidate.id,
        clerk_id: candidate.clerk_id,
        name: candidate.name,
        pronouns: candidate.pronouns,
        email: candidate.email,
        avatar_url: candidate.avatar_url,
        era: candidate.era,
        intentions: normalizedCandidate.intentions,
        match_types: normalizedCandidate.match_types,
        compatibility_score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.compatibility_score - a.compatibility_score);

  return res.json({ matches });
});

module.exports = { matchesRouter };
