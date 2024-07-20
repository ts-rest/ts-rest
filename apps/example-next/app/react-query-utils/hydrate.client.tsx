'use client';

import { Hydrate as OgHydrate, HydrateProps } from '@tanstack/react-query';

export function Hydrate(props: HydrateProps) {
  return <OgHydrate {...props} />;
}
