export function scorePotential(item) {
  const weights = {
    familyFreedom: 3,
    wealth: 3,
    health: 2,
    intelligence: 2,
    asset: 3,
    effortReduction: 2,
    riskProtection: 3,
  };

  const raw =
    (Number(item.familyFreedom) || 0) * weights.familyFreedom +
    (Number(item.wealth) || 0) * weights.wealth +
    (Number(item.health) || 0) * weights.health +
    (Number(item.intelligence) || 0) * weights.intelligence +
    (Number(item.asset) || 0) * weights.asset +
    (Number(item.effortReduction) || 0) * weights.effortReduction +
    (Number(item.riskProtection) || 0) * weights.riskProtection;

  const score = Math.min(100, Math.round((raw / 90) * 100));

  let tier = 'D-Tier';
  let label = 'Reject / distraction';

  if (score >= 85) {
    tier = 'S-Tier';
    label = 'Do now';
  } else if (score >= 70) {
    tier = 'A-Tier';
    label = 'Schedule soon';
  } else if (score >= 50) {
    tier = 'B-Tier';
    label = 'Useful';
  } else if (score >= 30) {
    tier = 'C-Tier';
    label = 'Archive / later';
  }

  return { score, tier, label };
}

export function getTopProject(projects) {
  if (!projects?.length) return null;
  return [...projects].sort((a, b) => scorePotential(b).score - scorePotential(a).score)[0];
}
