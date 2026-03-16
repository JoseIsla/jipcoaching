/**
 * Loads the JIP Coaching logo as a base64 data URL for embedding in PDFs.
 * Caches the result so it's only fetched once.
 */
let cachedLogo: string | null = null;

export const loadLogoBase64 = async (): Promise<string | null> => {
  if (cachedLogo) return cachedLogo;
  try {
    const response = await fetch("/assets/logo-jip.png");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogo = reader.result as string;
        resolve(cachedLogo);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};
