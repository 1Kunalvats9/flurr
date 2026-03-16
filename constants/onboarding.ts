export type PresentationOption = {
  label: string;
  value: string;
};

export type ArchetypeOption = {
  key: string;
  title: string;
  helper: string;
  subtitle: string;
  description: string;
  icon: string;
};

export const PRESENTATION_OPTIONS: PresentationOption[] = [
  { label: 'androgynous', value: 'androgynous' },
  { label: 'masc', value: 'masc' },
  { label: 'soft-masc', value: 'soft masc' },
  { label: 'gender-queer', value: 'gender-queer' },
  { label: 'gender-fluid', value: 'gender-fluid' },
  { label: 'fairy', value: 'fairy' },
  { label: 'soft femme', value: 'soft femme' },
  { label: 'femme', value: 'femme' },
  { label: 'other', value: 'other' },
  { label: 'high femme queen', value: 'high femme queen' },
  { label: 'tomboi', value: 'tomboi' },
  { label: 'butch', value: 'butch' },
];

export const ARCHETYPE_OPTIONS: ArchetypeOption[] = [
  {
    key: 'moss',
    title: 'moss',
    helper: 'grounded, quiet energy, always present',
    subtitle: 'the steady one',
    description: 'soft touch, deep care - here for safe love and slow burn.',
    icon: 'leaf-outline',
  },
  {
    key: 'blaze',
    title: 'blaze',
    helper: 'bold, magnetic, takes up space',
    subtitle: 'the party girl',
    description: 'I flirt with the night and find god on the dance floor.',
    icon: 'sunny-outline',
  },
  {
    key: 'jade',
    title: 'jade',
    helper: 'wise, calm, deeply intuitive',
    subtitle: 'the hookup romantic',
    description: 'I want the spark and the story - both can exist.',
    icon: 'diamond-outline',
  },
  {
    key: 'lune',
    title: 'lune',
    helper: 'dreamy, emotional, inner world is vast',
    subtitle: 'the homebody dreamer',
    description: 'give me candles, playlists, and slow conversations.',
    icon: 'moon-outline',
  },
  {
    key: 'rio',
    title: 'rio',
    helper: 'free-spirited, always moving, infectious energy',
    subtitle: 'the hookup romantic',
    description: 'I want the spark and the story - both can exist.',
    icon: 'rainy-outline',
  },
  {
    key: 'sage',
    title: 'sage',
    helper: 'thoughtful, measured, sees the bigger picture',
    subtitle: 'the deep feeler',
    description: 'I crave intensity but lead with tenderness.',
    icon: 'triangle-outline',
  },
  {
    key: 'luz',
    title: 'luz',
    helper: 'warm, radiant, lights up a room',
    subtitle: 'the connector',
    description: 'I bring the group together and make sure everyone eats.',
    icon: 'star-outline',
  },
  {
    key: 'sol',
    title: 'sol',
    helper: 'confident, generous, natural leader',
    subtitle: 'the lowkey cool',
    description: "quiet confidence - I'm the calm in the corner.",
    icon: 'ellipse-outline',
  },
  {
    key: 'zea',
    title: 'zea',
    helper: 'curious, playful, finds joy everywhere',
    subtitle: 'the curious wanderer',
    description: 'I follow my gut, not a plan - people are my adventure.',
    icon: 'planet-outline',
  },
  {
    key: 'indigo',
    title: 'indigo',
    helper: 'deep, mysterious, intensely feeling',
    subtitle: 'the reformed romantic',
    description: 'once hopeless, now honest - still believe in real connection.',
    icon: 'water-outline',
  },
];
