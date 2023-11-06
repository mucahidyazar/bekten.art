export function isValidImage(url: string) {
  // URL'nin resim uzantısını kontrol eden regex pattern
  const validImageUrlRegex = /\.(jpg|jpeg|png|gif|bmp)$/i;

  // URL regex ile eşleşiyorsa true, aksi takdirde false döner
  return validImageUrlRegex.test(url);
}

export function isValidImageUrl(url: string) {
  // Öncelikle geçerli bir HTTP ya da HTTPS URL'si olup olmadığını kontrol eder
  if (!isValidUrl(url)) {
    return false;
  }

  // URL'nin resim uzantısını kontrol eden regex pattern
  const validImageUrlRegex = /\.(jpg|jpeg|png|gif|bmp)$/i;

  // URL regex ile eşleşiyorsa true, aksi takdirde false döner
  return validImageUrlRegex.test(url);
}

export function isValidUrl(urlString: string) {
  let url;

  try {
    url = new URL(urlString);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}
