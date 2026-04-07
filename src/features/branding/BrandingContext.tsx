'use client';

import { createContext, useContext, useEffect } from 'react';

export type Branding = {
  organizationId: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  businessName: string | null;
  receiptShowLogo: boolean;
  receiptAddress: string | null;
  receiptPhone: string | null;
  receiptCuit: string | null;
  receiptFooter: string | null;
};

const BrandingContext = createContext<Branding | null>(null);

export const useBranding = () => useContext(BrandingContext);

function hexToHsl(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const lig = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    sat = lig > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: hue = ((b - r) / d + 2) / 6; break;
      case b: hue = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(lig * 100)}%`;
}

export const BrandingProvider = ({
  branding,
  children,
}: {
  branding: Branding | null;
  children: React.ReactNode;
}) => {
  useEffect(() => {
    if (branding?.primaryColor) {
      try {
        const hsl = hexToHsl(branding.primaryColor);
        document.documentElement.style.setProperty('--primary', hsl);
      } catch {
        // color inválido, ignorar
      }
    } else {
      document.documentElement.style.removeProperty('--primary');
    }
  }, [branding?.primaryColor]);

  useEffect(() => {
    if (branding?.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.faviconUrl;
    }
  }, [branding?.faviconUrl]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
};
