const lines = {
  Talk: [
    'I am here. Speak clearly and I will help organise the next move.',
    'Your Core is listening. We turn thought into action.'
  ],
  Build: [
    'Builder Mode online. We build assets, not distractions.',
    'Give me the structure, the bug, or the goal. I will help turn it into working software.'
  ],
  Create: [
    'Creation Mode online. Ideas become IP, assets, songs, books, anime, and systems.',
    'Your imagination is raw material. We shape it into something real.'
  ],
  Learn: [
    'Learning Mode online. Knowledge only matters if it upgrades Dylan.',
    'I will help turn information into capability.'
  ],
  Wealth: [
    'Wealth Mode online. Sustainable profit, protected downside, family time preserved.',
    'We build wealth without gambling Dylan’s future.'
  ],
  Life: [
    'Life Mode online. Family, health, freedom, and meaning stay protected.',
    'Human Dylan lives. Dylan Core prepares.'
  ],
  Memory: [
    'Memory Mode online. What matters should not be lost.',
    'Save the lesson. The future version of us will use it.'
  ],
};

export function presenceLine(mode) {
  const pool = lines[mode] || lines.Talk;
  const index = new Date().getMinutes() % pool.length;
  return pool[index];
}
