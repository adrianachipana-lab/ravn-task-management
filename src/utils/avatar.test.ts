import { describe, expect, it } from 'vitest';
import { getAvatarUrl } from './avatar';

describe('getAvatarUrl', () => {
  it('returns a valid API avatar URL when provided', () => {
    const avatar = 'https://example.com/avatar.png';
    expect(getAvatarUrl(avatar, 'Jane Doe')).toBe(avatar);
  });

  it('returns a stock avatar when the API avatar is missing', () => {
    expect(getAvatarUrl(null, 'Jane Doe')).toContain('images.unsplash.com');
    expect(getAvatarUrl('', 'Jane Doe')).toContain('images.unsplash.com');
  });

  it('returns a stock avatar when the API avatar is not a URL', () => {
    expect(getAvatarUrl('/avatar.png', 'Jane Doe')).toContain('images.unsplash.com');
    expect(getAvatarUrl('not-an-image', 'Jane Doe')).toContain('images.unsplash.com');
  });
});
