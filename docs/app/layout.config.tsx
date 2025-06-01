import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  githubUrl: 'https://github.com/ts-rest/ts-rest',
  nav: {
    title: (
      <>
        <svg
          width="24"
          height="24"
          viewBox="0 0 116 115"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_13_20)">
            <rect width="116" height="116" rx="26" fill="#9333EA" />
            <path
              d="M62.487 59.9566L95.1166 60.1262L95.1493 53.8212L62.5198 53.6517L62.487 59.9566ZM62.5863 40.8469L95.2159 41.0164L95.2493 34.5815L62.6197 34.412L62.5863 40.8469ZM62.4168 73.4765L95.0463 73.646L95.0129 80.0809L62.3833 79.9114L62.4168 73.4765Z"
              fill="white"
            />
            <path
              d="M46.06 64.92C52.3 62.58 55.875 57.51 55.875 50.555C55.875 40.545 48.595 34.5 36.7 34.5H18.5V40.935H36.44C44.305 40.935 48.4 44.445 48.4 50.555C48.4 56.6 44.305 60.175 36.44 60.175H18.5V80H25.91V66.48H36.7C37.48 66.48 38.325 66.48 39.04 66.415L48.595 80H56.655L46.06 64.92Z"
              fill="white"
            />
          </g>
          <defs>
            <clipPath id="clip0_13_20">
              <rect width="116" height="115" fill="white" />
            </clipPath>
          </defs>
        </svg>
        ts-rest
      </>
    ),
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [],
};
