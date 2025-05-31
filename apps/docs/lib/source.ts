import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';
import { ReactElement, createElement } from 'react';
import { icons } from 'lucide-react';
import { ReactNode } from 'react';

// See https://fumadocs.vercel.app/docs/headless/source-api for more info
export const source = loader({
  // it assigns a URL to your pages
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  // @ts-expect-error - icon is not typed
  icon: (icon) => {
    if (!icon) {
      return undefined;
    }
    if (icon in icons) {
      return createElement(icons[icon as keyof typeof icons]);
    }
  },
});
