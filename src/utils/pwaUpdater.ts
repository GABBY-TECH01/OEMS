/**
 * Utility to dynamically update PWA manifest, favicons, meta tags,
 * and application branding across the DOM at runtime.
 */

export interface PWABrandingOptions {
  pwaAppTitle?: string;
  pwaShortName?: string;
  pwaLogoUrl?: string;
  pwaThemeColor?: string;
  pwaBackgroundColor?: string;
  companyName?: string;
  slogan?: string;
}

export function updatePWABrandingAndManifest(settings: PWABrandingOptions): void {
  if (typeof document === 'undefined') return;

  const title = settings.pwaAppTitle || settings.companyName || 'Offnot Energy Management System';
  const shortName = settings.pwaShortName || 'OffnotEnergy';
  const logo = settings.pwaLogoUrl || '/pwa-512x512.png';
  const themeColor = settings.pwaThemeColor || '#064e3b';
  const bgColor = settings.pwaBackgroundColor || '#0f172a';
  const description = settings.slogan || 'Enterprise Solar ERP & POS System for inventory, sales, and projects';

  // 1. Update Document Title
  document.title = title;

  // 2. Update Theme Color Meta Tag (for browser chrome & mobile top bar)
  let metaTheme = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  metaTheme.content = themeColor;

  // 3. Update Apple Mobile Web App Title
  let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
  if (appleTitle) {
    appleTitle.content = shortName;
  } else {
    appleTitle = document.createElement('meta');
    appleTitle.name = 'apple-mobile-web-app-title';
    appleTitle.content = shortName;
    document.head.appendChild(appleTitle);
  }

  // 4. Update Favicon & Shortcut Icons
  const iconRels = ['icon', 'shortcut icon'];
  iconRels.forEach(rel => {
    let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = logo;
  });

  // 5. Update Apple Touch Icon
  let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
  if (!appleIcon) {
    appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleIcon);
  }
  appleIcon.href = logo;

  // 6. Dynamically Generate and Inject Updated Web App Manifest via Blob URL
  const manifestData = {
    id: '/',
    name: title,
    short_name: shortName,
    description: description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: bgColor,
    theme_color: themeColor,
    icons: [
      {
        src: logo,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: logo,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: logo,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  try {
    const manifestBlob = new Blob([JSON.stringify(manifestData, null, 2)], {
      type: 'application/manifest+json',
    });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (manifestLink) {
      manifestLink.href = manifestUrl;
    } else {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = manifestUrl;
      document.head.appendChild(manifestLink);
    }
  } catch (err) {
    console.warn('Failed to update dynamic manifest blob:', err);
  }
}
