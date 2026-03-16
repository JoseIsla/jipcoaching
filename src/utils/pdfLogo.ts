/**
 * Loads the JIP Coaching logo as a base64 data URL for embedding in PDFs.
 * Caches the result so it's only fetched once.
 */
let cachedLogo: string | null = null;
let logoAttempted = false;

export const loadLogoBase64 = async (): Promise<string | null> => {
  if (cachedLogo) return cachedLogo;
  if (logoAttempted) return null; // don't retry on failure
  logoAttempted = true;
  try {
    const response = await fetch("/assets/logo-jip.png");
    if (!response.ok) return null;
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

/** Safely add the logo to a jsPDF document. Returns the x position after the logo for alignment. */
export const addLogoToDoc = (
  doc: any,
  logoBase64: string | null,
  x: number,
  y: number,
  height = 14,
): number => {
  if (!logoBase64) return x;
  try {
    // Logo is ~500x380 → aspect ratio ≈ 1.32:1
    const width = height * 1.32;
    doc.addImage(logoBase64, "PNG", x, y - height + 2, width, height);
    return x + width + 4;
  } catch {
    return x;
  }
};
