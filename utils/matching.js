function calculateCompatibility(userA, userB) {
  let score = 0;

  // Intent — max 9 points
  const intentionsA = userA.intentions || [];
  const intentionsB = userB.intentions || [];
  const intentOverlap = intentionsA.filter((item) => intentionsB.includes(item)).length;
  if (
    intentOverlap > 0 &&
    intentOverlap === intentionsA.length &&
    intentOverlap === intentionsB.length
  ) {
    score += 9;
  } else if (intentOverlap > 0) {
    score += 5;
  }

  // Identity — max 7 points
  if (
    userA.is_bipoc !== null &&
    userA.is_bipoc !== undefined &&
    userB.is_bipoc !== null &&
    userB.is_bipoc !== undefined &&
    userA.is_bipoc === userB.is_bipoc
  ) {
    score += 7;
  }

  // Presentation match — max 7 points
  if (
    userA.presentation &&
    userB.presentation &&
    userA.presentation === userB.presentation
  ) {
    score += 7;
  }

  // Presentation preference bonus — max 1 point
  if (
    userA.presentation &&
    userB.presentation &&
    Array.isArray(userA.presentation_preferences) &&
    Array.isArray(userB.presentation_preferences) &&
    userA.presentation_preferences.includes(userB.presentation) &&
    userB.presentation_preferences.includes(userA.presentation)
  ) {
    score += 1;
  }

  // Archetype match — max 6 points
  if (
    userA.archetype &&
    userB.archetype &&
    userA.archetype === userB.archetype
  ) {
    score += 6;
  }

  // Archetype preference bonus — max 1 point
  if (
    userA.archetype &&
    userB.archetype &&
    Array.isArray(userA.archetype_preferences) &&
    Array.isArray(userB.archetype_preferences) &&
    userA.archetype_preferences.includes(userB.archetype) &&
    userB.archetype_preferences.includes(userA.archetype)
  ) {
    score += 1;
  }

  const raw = score;
  const percent = Math.round((score / 31) * 100);

  return { raw, percent };
}

module.exports = { calculateCompatibility };
