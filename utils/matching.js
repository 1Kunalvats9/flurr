function calculateCompatibility(currentUser, candidate) {
  let score = 0;

  // Intentions overlap - 40 points max
  const intentionOverlap = currentUser.intentions.filter((i) => candidate.intentions.includes(i)).length;
  score += (intentionOverlap / Math.max(currentUser.intentions.length, 1)) * 40;

  // Match type overlap - 35 points max
  const matchTypeOverlap = currentUser.match_types.filter((m) => candidate.match_types.includes(m)).length;
  score += (matchTypeOverlap / Math.max(currentUser.match_types.length, 1)) * 35;

  // Era proximity - 25 points max
  // 0 difference = 25 pts, 50 difference = 0 pts
  const eraDiff = Math.abs(currentUser.era - candidate.era);
  score += Math.max(0, 25 - eraDiff * 0.5);

  return Math.round(Math.min(score, 100));
}

module.exports = { calculateCompatibility };
