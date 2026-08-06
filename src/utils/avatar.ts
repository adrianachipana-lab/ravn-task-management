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

function getFallbackAvatar(fullName: string): string {
  return STOCK_AVATARS[hashName(fullName) % STOCK_AVATARS.length];
}

function isValidImageUrl(avatar: string | null | undefined): avatar is string {
  if (!avatar?.trim()) return false;

  try {
    const url = new URL(avatar);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

// Returns the user's avatar URL, or a deterministic stock portrait when the API has none
export function getAvatarUrl(avatar: string | null | undefined, fullName: string): string {
  if (isValidImageUrl(avatar)) return avatar;
  return getFallbackAvatar(fullName);
}
