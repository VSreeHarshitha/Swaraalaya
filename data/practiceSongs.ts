export interface PracticeSong {
  title: string;
  category: 'Tongue-Twister' | 'Musical Theatre' | 'Rap' | 'Classic Poetry';
  lyrics: string;
  lang?: string; // Optional: ISO language code (e.g., 'en-US', 'hi-IN')
}

export const practiceSongs: PracticeSong[] = [
  {
    title: "Peter Piper",
    category: "Tongue-Twister",
    lyrics: "Peter Piper picked a peck of pickled peppers.\nA peck of pickled peppers Peter Piper picked.\nIf Peter Piper picked a peck of pickled peppers,\nWhere's the peck of pickled peppers Peter Piper picked?",
    lang: "en-US",
  },
  {
    title: "कच्चा पापड़ (Kaccha Papad)",
    category: "Tongue-Twister",
    lyrics: "कच्चा पापड़, पक्का पापड़। कच्चा पापड़, पक्का पापड़।",
    lang: "hi-IN",
  },
  {
    title: "Supercalifragilisticexpialidocious",
    category: "Musical Theatre",
    lyrics: "Supercalifragilisticexpialidocious!\nEven though the sound of it\nIs something quite atrocious\nIf you say it loud enough\nYou'll always sound precocious!",
    lang: "en-US",
  },
  {
    title: "Modern Major-General",
    category: "Musical Theatre",
    lyrics: "I am the very model of a modern Major-General,\nI've information vegetable, animal, and mineral,\nI know the kings of England, and I quote the fights historical\nFrom Marathon to Waterloo, in order categorical.",
    lang: "en-US",
  },
  {
    title: "She Sells Sea-Shells",
    category: "Tongue-Twister",
    lyrics: "She sells sea-shells on the sea-shore.\nThe shells she sells are sea-shells, I'm sure.\nFor if she sells sea-shells on the sea-shore,\nThen I'm sure she sells sea-shore shells.",
    lang: "en-US",
  },
  {
    title: "The Raven (Verse 1)",
    category: "Classic Poetry",
    lyrics: "Once upon a midnight dreary, while I pondered, weak and weary,\nOver many a quaint and curious volume of forgotten lore—\nWhile I nodded, nearly napping, suddenly there came a tapping,\nAs of some one gently rapping, rapping at my chamber door.",
    lang: "en-US",
  },
];