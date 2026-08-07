export const DEFAULT_AVATAR_URL = '/default-avatar.svg';

function isValidImageUrl(avatar: string | null | undefined): avatar is string {
  if (!avatar?.trim()) return false;

  try {
    const url = new URL(avatar);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

// Returns the user's avatar URL, or a neutral placeholder when the API has none
export function getAvatarUrl(avatar: string | null | undefined): string {
  if (isValidImageUrl(avatar)) return avatar;
  return DEFAULT_AVATAR_URL;
}
