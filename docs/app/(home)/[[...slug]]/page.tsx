import { source } from '@/lib/source';
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getMDXComponents } from '@/mdx-components';

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDXContent = page.data.body;

  const isHomePage = page.data.title === 'Intro';

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      {isHomePage ? (
        <div className="flex w-full flex-col gap-4 items-center justify-center">
          <svg
            className="w-2/3 max-w-2xl dark:fill-white fill-black"
            viewBox="0 0 316 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="316" height="70" fill="transparent"></rect>
            <path
              d="M44.04 55V20.448H57.536V15.8H25.224V20.448H38.72V55H44.04ZM79.6096 55.448C89.8576 55.448 94.6736 50.296 94.6736 44.36C94.6736 29.968 70.8736 36.072 70.8736 26.328C70.8736 22.8 73.7856 19.944 80.5056 19.944C83.9776 19.944 87.8976 20.952 91.3136 23.136L93.0496 18.88C89.8016 16.64 85.0976 15.352 80.5616 15.352C70.2576 15.352 65.6096 20.504 65.6096 26.496C65.6096 41.056 89.4096 34.896 89.4096 44.696C89.4096 48.168 86.4416 50.856 79.6096 50.856C74.5696 50.856 69.5856 48.952 66.6736 46.32L64.6576 50.464C67.7376 53.432 73.6176 55.448 79.6096 55.448ZM121.202 41.896V37.416H106.25V41.896H121.202ZM158.263 41.784C163.751 39.824 166.943 35.512 166.943 29.464C166.943 20.896 160.783 15.8 150.647 15.8H135.471V20.448H150.479C157.759 20.448 161.567 23.752 161.567 29.464C161.567 35.12 157.759 38.424 150.479 38.424H135.471V55H140.791V43.016H150.647C151.543 43.016 152.383 42.96 153.223 42.904L161.735 55H167.615L158.263 41.784ZM181.144 37.36H208.64V32.824H181.144V37.36ZM181.144 20.224H208.64V15.576H181.144V20.224ZM181.144 50.352H208.64V55H181.144V50.352ZM235.012 55.448C245.26 55.448 250.076 50.296 250.076 44.36C250.076 29.968 226.276 36.072 226.276 26.328C226.276 22.8 229.188 19.944 235.908 19.944C239.38 19.944 243.3 20.952 246.716 23.136L248.452 18.88C245.204 16.64 240.5 15.352 235.964 15.352C225.66 15.352 221.012 20.504 221.012 26.496C221.012 41.056 244.812 34.896 244.812 44.696C244.812 48.168 241.844 50.856 235.012 50.856C229.972 50.856 224.988 48.952 222.076 46.32L220.06 50.464C223.14 53.432 229.02 55.448 235.012 55.448ZM275.968 55V20.448H289.464V15.8H257.152V20.448H270.648V55H275.968Z"
              fill="inherit"
            ></path>
          </svg>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              margin: '0',
              padding: '0',
            }}
          >
            <a href="https://github.com/ts-rest/ts-rest">
              <img
                alt="GitHub Repo stars"
                src="https://img.shields.io/github/stars/ts-rest/ts-rest"
              />
            </a>
            <a href="https://www.npmjs.com/package/@ts-rest/core">
              <img src="https://img.shields.io/npm/dm/%40ts-rest/core" />
            </a>
            <a
              href="https://github.com/ts-rest/ts-rest/blob/main/LICENSE"
              className="hidden lg:block"
            >
              <img
                alt="License"
                src="https://img.shields.io/github/license/ts-rest/ts-rest"
              />
            </a>
            <a
              href="https://bundlephobia.com/package/@ts-rest/core"
              className="hidden lg:block"
            >
              <img
                alt="Bundle Size"
                src="https://img.shields.io/bundlephobia/minzip/%40ts-rest%2Fcore"
              />
            </a>
            <a href="https://www.npmjs.com/package/@ts-rest/core">
              <img
                alt="NPM Version"
                src="https://img.shields.io/npm/v/%40ts-rest%2Fcore"
              />
            </a>
            <a href="https://discord.com/invite/2Megk85k5a">
              <img
                alt="NPM Version"
                src="https://img.shields.io/discord/1055855205960392724"
              />
            </a>
          </div>
        </div>
      ) : (
        <>
          <DocsTitle>{page.data.title}</DocsTitle>
          <DocsDescription>{page.data.description}</DocsDescription>
        </>
      )}
      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
