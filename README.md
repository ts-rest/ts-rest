# ts-rest

<p align="center">
 <img src="https://avatars.githubusercontent.com/u/109956939?s=400&u=8bf67b1281da46d64eab85f48255cd1892bf0885&v=4" height="150"></img>
</p>

<p align="center">Incrementally adoptable RPC-like client and server helpers for a magical end to end typed experience 🪄</p>

<p align="center">
  <a href="https://github.com/ts-rest/ts-rest">
    <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/ts-rest/ts-rest"/>
  </a>
  <a href="https://www.npmjs.com/package/@ts-rest/core">
    <img src="https://img.shields.io/npm/dm/%40ts-rest/core"/>
  </a>
  <a href="https://github.com/ts-rest/ts-rest/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/ts-rest/ts-rest"/>
  </a>
  <a href="https://bundlephobia.com/package/@ts-rest/core">
    <img alt="Bundle Size" src="https://img.shields.io/bundlephobia/minzip/@ts-rest/core?label=%40ts-rest%2Fcore"/>
  </a>
</p>

<div align="center">
  <div>Join us on Discord for help, feedback, and discussions!</div><br></br>
  <a href="https://discord.gg/2Megk85k5a">
    <img src="https://discordapp.com/api/guilds/1055855205960392724/widget.png?style=banner2" alt="Discord Shield"/>
  </a>
</div>

# Introduction

ts-rest offers a simple way to define a contract for your API, which can be both consumed and implemented by your application, giving you end to end type safety without the hassle or code generation.

### Features

- End-to-end type safety 🛟
- RPC-like client side API ⚡️
- Small Bundle Size 📉
- No Code Generation 🏃‍♀️
- Zod support for runtime validation 🔒
- Full optional OpenAPI integration 📝

<div align="center">
  <h3>👉 Start reading the official <a href="https://ts-rest.com/docs/quickstart?utm_source=github&utm_medium=documentation&utm_campaign=readme">Quickstart Guide</a> 👈</h3>
</div>

### Super Simple Example

Easily define your API contract somewhere shared

```typescript
const contract = c.router({
  getPosts: {
    method: 'GET',
    path: '/posts',
    query: z.object({
      skip: z.number(),
      take: z.number(),
    }), // <-- Zod schema
    responses: {
      200: c.type<Post[]>(), // <-- OR normal TS types
    },
    headers: z.object({
      'x-pagination-page': z.coerce.number().optional(),
    }),
  },
});
```

Fulfill the contract on your server, with a type-safe router:

```typescript
const router = s.router(contract, {
  getPosts: async ({ params: { id } }) => {
    return {
      status: 200,
      body: prisma.post.findUnique({ where: { id } }),
    };
  },
});
```

Consume the api on the client with a RPC-like interface:

```typescript
const result = await client.getPosts({
  headers: { 'x-pagination-page': 1 },
  query: { skip: 0, take: 10 },
  // ^-- Fully typed!
});
```

## Quickstart

Create a contract, implement it on your server then consume it in your client. Incrementally adopt, trial it with your team, then get shipping faster.

<div align="center">
  <h3>👉 Start reading the official <a href="https://ts-rest.com/docs/quickstart?utm_source=github&utm_medium=documentation&utm_campaign=readme">Quickstart Guide</a> 👈</h3>
</div>

## Contributors ✨

MASSIVE Thanks to all of these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)), who have helped make ts-rest possible:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://gabro.la"><img src="https://avatars.githubusercontent.com/u/1728215?v=4?s=100" width="100px;" alt="Youssef Gaber"/><br /><sub><b>Youssef Gaber</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=Gabrola" title="Code">💻</a> <a href="#ideas-Gabrola" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/ts-rest/ts-rest/commits?author=Gabrola" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/netiperher"><img src="https://avatars.githubusercontent.com/u/45091747?v=4?s=100" width="100px;" alt="Per Hermansson"/><br /><sub><b>Per Hermansson</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=netiperher" title="Documentation">📖</a> <a href="https://github.com/ts-rest/ts-rest/commits?author=netiperher" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ghoullier.deno.dev/"><img src="https://avatars.githubusercontent.com/u/2315749?v=4?s=100" width="100px;" alt="Grégory Houllier"/><br /><sub><b>Grégory Houllier</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=ghoullier" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://michaelangrivera.com"><img src="https://avatars.githubusercontent.com/u/55844504?v=4?s=100" width="100px;" alt="Michael Angelo "/><br /><sub><b>Michael Angelo </b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=michaelangrivera" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://pieter.venter.pro"><img src="https://avatars.githubusercontent.com/u/1845861?v=4?s=100" width="100px;" alt="Pieter Venter"/><br /><sub><b>Pieter Venter</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=cyrus-za" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://rifaldhiaw.com"><img src="https://avatars.githubusercontent.com/u/7936061?v=4?s=100" width="100px;" alt="Rifaldhi AW"/><br /><sub><b>Rifaldhi AW</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=rifaldhiaw" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Jwcode-uk"><img src="https://avatars.githubusercontent.com/u/30149596?v=4?s=100" width="100px;" alt="Jonathan White "/><br /><sub><b>Jonathan White </b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=Jwcode-uk" title="Code">💻</a> <a href="https://github.com/ts-rest/ts-rest/commits?author=Jwcode-uk" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/gingermusketeer"><img src="https://avatars.githubusercontent.com/u/1177034?v=4?s=100" width="100px;" alt="Max Brosnahan"/><br /><sub><b>Max Brosnahan</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=gingermusketeer" title="Code">💻</a> <a href="#ideas-gingermusketeer" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://oliverbutler.uk"><img src="https://avatars.githubusercontent.com/u/47489826?v=4?s=100" width="100px;" alt="Oliver Butler"/><br /><sub><b>Oliver Butler</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=oliverbutler" title="Code">💻</a> <a href="#ideas-oliverbutler" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/ts-rest/ts-rest/commits?author=oliverbutler" title="Documentation">📖</a> <a href="#infra-oliverbutler" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-oliverbutler" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/baryla"><img src="https://avatars.githubusercontent.com/u/10336085?v=4?s=100" width="100px;" alt="Adrian Barylski"/><br /><sub><b>Adrian Barylski</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=baryla" title="Code">💻</a> <a href="https://github.com/ts-rest/ts-rest/commits?author=baryla" title="Documentation">📖</a> <a href="https://github.com/ts-rest/ts-rest/commits?author=baryla" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://nad.dev"><img src="https://avatars.githubusercontent.com/u/6670753?v=4?s=100" width="100px;" alt="Neil A. Dobson"/><br /><sub><b>Neil A. Dobson</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=neildobson-au" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dohaicuong"><img src="https://avatars.githubusercontent.com/u/20808725?v=4?s=100" width="100px;" alt="Eric Do"/><br /><sub><b>Eric Do</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=dohaicuong" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fruchtzwerg"><img src="https://avatars.githubusercontent.com/u/15377955?v=4?s=100" width="100px;" alt="Ben"/><br /><sub><b>Ben</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=fruchtzwerg" title="Code">💻</a> <a href="https://github.com/ts-rest/ts-rest/commits?author=fruchtzwerg" title="Documentation">📖</a> <a href="https://github.com/ts-rest/ts-rest/commits?author=fruchtzwerg" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://llllvvuu.dev"><img src="https://avatars.githubusercontent.com/u/5601392?v=4?s=100" width="100px;" alt="LW"/><br /><sub><b>LW</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=llllvvuu" title="Code">💻</a> <a href="https://github.com/ts-rest/ts-rest/issues?q=author%3Allllvvuu" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/avancealaska"><img src="https://avatars.githubusercontent.com/u/72231502?v=4?s=100" width="100px;" alt="Andrew Vance"/><br /><sub><b>Andrew Vance</b></sub></a><br /><a href="https://github.com/ts-rest/ts-rest/commits?author=avancealaska" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## Star History

Since our first commit in 2022 we've been growing steadily. We're proud of our progress and we're excited about the future.

<div align="center">
<a href="https://star-history.com/#ts-rest/ts-rest&Timeline">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=ts-rest/ts-rest&type=Timeline&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=ts-rest/ts-rest&type=Timeline" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=ts-rest/ts-rest&type=Timeline" />
  </picture>
</a>
</div>

<div align="center" >
  <div>Join us on Discord for help, feedback, and discussions!</div><br></br>
  <a href="https://discord.gg/2Megk85k5a">
    <img src="https://discordapp.com/api/guilds/1055855205960392724/widget.png?style=banner2" alt="Discord Shield"/>
  </a>
</div>

<div  align="center">
  <a
    href="https://vercel.com/?utm_source=ts-rest&utm_campaign=oss"
    target="_blank"
    rel="noreferrer"
  >
    <img
      src="https://ts-rest.com/img/powered-by-vercel.svg"
      alt="Powered by Vercel"
      height="40"
    />
  </a>
</div>
