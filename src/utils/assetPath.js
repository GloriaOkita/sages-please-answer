export function assetPath(path) {
  if (typeof path !== "string" || !path.startsWith("/assets/")) return path;
  return `${import.meta.env.BASE_URL}${path.slice(1)}`;
}
