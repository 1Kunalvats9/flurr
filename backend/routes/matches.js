const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { calculateCompatibility } = require('../utils/matching');

const matchesRouter = express.Router();
const MIN_PERCENT = 40;

function unwrapPreference(preferences) {
  if (Array.isArray(preferences)) return preferences[0] || null;
  return preferences || null;
}

function getStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

matchesRouter.get('/', async (req, res) => {
  try {
    const { data: currentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('clerk_id, era')
      .eq('clerk_id', req.userId)
      .maybeSingle();

    if (profileError) return res.status(500).json({ error: profileError.message });
    if (!currentProfile) return res.json({ matches: [] });

    const { data: currentPreferences, error: prefError } = await supabaseAdmin
      .from('preferences')
      .select('intentions, match_types, is_bipoc, presentation, presentation_preferences, archetype, archetype_preferences')
      .eq('clerk_id', req.userId)
      .maybeSingle();

    if (prefError) return res.status(500).json({ error: prefError.message });
    if (!currentPreferences) return res.json({ matches: [] });

    const { data: seen, error: seenError } = await supabaseAdmin
      .from('interactions')
      .select('to_clerk_id')
      .eq('from_clerk_id', req.userId);

    if (seenError) return res.status(500).json({ error: seenError.message });

    const seenIds = (seen || []).map((row) => row.to_clerk_id);

    let candidateQuery = supabaseAdmin
      .from('profiles')
      .select(`
        id,
        clerk_id,
        name,
        pronouns,
        email,
        avatar_url,
        era,
        preferences (
          intentions,
          match_types,
          is_bipoc,
          presentation,
          presentation_preferences,
          archetype,
          archetype_preferences
        )
      `)
      .neq('clerk_id', req.userId)
      .eq('onboarding_complete', true);

    if (seenIds.length > 0) {
      candidateQuery = candidateQuery.not('clerk_id', 'in', `(${seenIds.map((id) => `"${id}"`).join(',')})`);
    }

    const { data: candidates, error: candidatesError } = await candidateQuery;
    if (candidatesError) return res.status(500).json({ error: candidatesError.message });

    const currentUser = {
      intentions: getStringArray(currentPreferences.intentions),
      match_types: getStringArray(currentPreferences.match_types),
      is_bipoc: currentPreferences.is_bipoc,
      presentation: currentPreferences.presentation,
      presentation_preferences: getStringArray(currentPreferences.presentation_preferences),
      archetype: currentPreferences.archetype,
      archetype_preferences: getStringArray(currentPreferences.archetype_preferences),
      era: Number(currentProfile.era) || 50,
    };

    const matches = (candidates || [])
      .map((candidate) => {
        const prefs = unwrapPreference(candidate.preferences);

        const normalizedCandidate = {
          intentions: getStringArray(prefs?.intentions),
          match_types: getStringArray(prefs?.match_types),
          is_bipoc: prefs?.is_bipoc,
          presentation: prefs?.presentation,
          presentation_preferences: getStringArray(prefs?.presentation_preferences),
          archetype: prefs?.archetype,
          archetype_preferences: getStringArray(prefs?.archetype_preferences),
          era: Number(candidate.era) || 50,
        };

        const { raw, percent } = calculateCompatibility(currentUser, normalizedCandidate);

        if (percent < MIN_PERCENT) return null;

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
          presentation: normalizedCandidate.presentation,
          archetype: normalizedCandidate.archetype,
          compatibility_score: percent,
          compatibility_raw: raw,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.compatibility_score - a.compatibility_score);

    return res.json({ matches });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = { matchesRouter };
