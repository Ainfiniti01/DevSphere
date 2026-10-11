export const getSafeReturnPath = (candidate: string | null | undefined, fallback = '/') => {
  if (!candidate) return fallback;

  try {
    const url = new URL(candidate, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/') || url.pathname.startsWith('//')) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
};
