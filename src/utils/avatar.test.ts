import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR_URL, getAvatarUrl } from './avatar';

describe('getAvatarUrl', () => {
  it('returns a valid API avatar URL when provided', () => {
    const avatar = 'https://example.com/avatar.png';
    expect(getAvatarUrl(avatar, 'Jane Doe')).toBe(avatar);
  });

  it('returns a neutral default avatar when the API avatar is missing', () => {
    expect(getAvatarUrl(null, 'Jane Doe')).toBe(DEFAULT_AVATAR_URL);
    expect(getAvatarUrl('', 'Jane Doe')).toBe(DEFAULT_AVATAR_URL);
  });

  it('returns a neutral default avatar when the API avatar is not a URL', () => {
    expect(getAvatarUrl('/avatar.png', 'Jane Doe')).toBe(DEFAULT_AVATAR_URL);
    expect(getAvatarUrl('not-an-image', 'Jane Doe')).toBe(DEFAULT_AVATAR_URL);
  });
});
