const STOCK_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=160&h=160&q=80',
];

function hashName(fullName: string): number {
  return [...fullName].reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

// Returns the user's avatar URL, or a deterministic stock portrait when the API has none
export function getAvatarUrl(avatar: string | null | undefined, fullName: string): string {
  if (avatar) return avatar;
  return STOCK_AVATARS[hashName(fullName) % STOCK_AVATARS.length];
}
