export const PHASES = [
  { id: 1, label: 'Birth & Childhood', color: '#d4af37', glow: 'rgba(212,175,55,0.14)', description: 'From Gabriel\'s announcement to the boy who astonished teachers in the Temple.' },
  { id: 2, label: 'The Preparation', color: '#5b9fd4', glow: 'rgba(91,159,212,0.14)', description: 'John the Baptist, the Jordan baptism, and victory in the wilderness.' },
  { id: 3, label: 'Early Light', color: '#6aafc8', glow: 'rgba(106,175,200,0.14)', description: 'First disciples, first signs, and the widening circle of revelation.' },
  { id: 4, label: 'Galilee — The Great Work', color: '#4aad72', glow: 'rgba(74,173,114,0.14)', description: 'Three years of teaching, healing, and proclaiming the Kingdom of God.' },
  { id: 5, label: 'Toward Jerusalem', color: '#9b7ec8', glow: 'rgba(155,126,200,0.14)', description: 'The final road south — Lazarus raised, Zacchaeus redeemed, destiny near.' },
  { id: 6, label: 'Passion Week', color: '#d44a4a', glow: 'rgba(212,74,74,0.16)', description: 'Hosannas, the upper room, Gethsemane, the cross, and the tomb.' },
  { id: 7, label: 'Risen & Ascended', color: '#f0c85a', glow: 'rgba(240,200,90,0.16)', description: 'The empty tomb, living appearances, and ascension into glory.' },
];

export const phaseColor = (label) => PHASES.find(p => p.label === label)?.color ?? '#c9a227';
export const phaseGlow = (label) => PHASES.find(p => p.label === label)?.glow ?? 'rgba(201,162,39,0.05)';