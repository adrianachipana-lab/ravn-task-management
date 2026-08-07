import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR_URL, getAvatarUrl } from './avatar';

describe('getAvatarUrl', () => {
  it('returns a valid API avatar URL when provided', () => {
    const avatar = 'https://example.com/avatar.png';
    expect(getAvatarUrl(avatar)).toBe(avatar);
  });

  it('returns a neutral default avatar when the API avatar is missing', () => {
    expect(getAvatarUrl(null)).toBe(DEFAULT_AVATAR_URL);
    expect(getAvatarUrl('')).toBe(DEFAULT_AVATAR_URL);
  });

  it('returns a neutral default avatar when the API avatar is not a URL', () => {
    expect(getAvatarUrl('/avatar.png')).toBe(DEFAULT_AVATAR_URL);
    expect(getAvatarUrl('not-an-image')).toBe(DEFAULT_AVATAR_URL);
  });
});
