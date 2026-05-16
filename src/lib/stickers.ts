const localStickersGlob = import.meta.glob('/src/assets/stickers/*.{png,jpg,jpeg,svg,gif,webp}', { eager: true, query: '?url', import: 'default' });

export function resolveStickerUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  
  // If the url is a raw src path (saved in dev mode or legacy), try to see if it matches our glob keys
  if (url.startsWith('/src/assets/stickers/')) {
    // If the path exists in our glob, return the hashed/resolved url that glob gave us
    if (localStickersGlob[url]) {
      return localStickersGlob[url] as string;
    }
  }

  return url;
}

export const localStickers = Object.entries(localStickersGlob).map(([path, url]) => {
  const filename = path.split('/').pop() || '';
  const name = filename.split('.')[0].replace(/[-_]/g, ' ');
  return { 
    name: name.charAt(0).toUpperCase() + name.slice(1), 
    id: path, // Stable indentifier to store in database
    resolvedUrl: url as string, // Real URL to display
  };
});

export const STICKER_CATALOG = [
  ...localStickers.map(s => ({ name: s.name, id: s.id, url: s.resolvedUrl })),
  { name: 'Red Heart', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Red%20Heart.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Red%20Heart.png' },
  { name: 'Sparkles', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Sparkles.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Sparkles.png' },
  { name: 'Fire', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fire.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fire.png' },
  { name: 'Star', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Star.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Star.png' },
  { name: 'Ribbon', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Ribbon.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Ribbon.png' },
  { name: 'Ghost', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Ghost.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Ghost.png' },
  { name: 'Skull', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Skull.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Skull.png' },
  { name: 'Alien', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Alien.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Alien.png' },
  { name: 'Butterfly', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Butterfly.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Butterfly.png' },
  { name: 'Cherry Blossom', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cherry%20Blossom.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cherry%20Blossom.png' },
  { name: 'Four Leaf Clover', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Four%20Leaf%20Clover.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Four%20Leaf%20Clover.png' },
  { name: 'Mushroom', id: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Mushroom.png', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Mushroom.png' },
];
