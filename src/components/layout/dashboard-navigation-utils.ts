export type NavigationLink = {
  download: boolean;
  href: string;
  target: string | null;
};

export function getInternalNavigationPath(
  link: NavigationLink,
  currentOrigin: string,
  currentPath: string,
): string | null {
  if (link.download || (link.target && link.target !== "_self")) return null;

  let destination: URL;
  try {
    destination = new URL(link.href, currentOrigin);
  } catch {
    return null;
  }

  if (
    destination.origin !== currentOrigin ||
    destination.pathname.startsWith("/api/")
  ) {
    return null;
  }

  const path = `${destination.pathname}${destination.search}`;
  return path === currentPath ? null : path;
}
