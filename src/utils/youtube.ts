/**
 * Extract the YouTube video ID from any common URL format.
 * Supports: youtu.be/<id>, youtube.com/watch?v=<id>, /embed/<id>, /shorts/<id>,
 * or a raw 11-char ID.
 */
export const extractYouTubeId = (input?: string | null): string | null => {
  if (!input) return null;
  const value = input.trim();
  if (!value) return null;

  // Raw ID (11 chars, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?[^#]*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = value.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
};

export const buildYouTubeEmbedUrl = (input?: string | null): string | null => {
  const id = extractYouTubeId(input);
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
};