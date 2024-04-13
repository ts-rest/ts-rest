# File Uploading

ts-rest supports multipart/form-data requests, this is useful for uploading files or working with FormData from a form.

## Contract

The contract implementation is the same as any other mutation, however, `contentType` must be set to `multipart/form-data` and the `body` must be a `FormData-compatible` object (one level deep, no weird nested structures!).

```ts
// contract.ts

import { initContract } from '@ts-rest/core';

const c = initContract();

export const postsContract = c.router({
  updatePostThumbnail: {
    method: 'POST',
    path: '/posts/:id/thumbnail',
    contentType: 'multipart/form-data', // <- Only difference
    body: c.type<{ thumbnail: File }>(), // <- Use File type in here
    responses: {
      200: z.object({
        uploadedFile: z.object({
          name: z.string(),
          size: z.number(),
          type: z.string(),
        }),
      }),
      400: z.object({
        message: z.string(),
      }),
    },
  },
});
```

## Client

If your query utilizes multipart/form-data, ts-rest allows you to choose from FormData or a type safe object, the latter is recommended in most cases, just make sure you don't make a nested object.

```ts
// client.ts

const App = () => {
  const [thumbnail, setThumbnail] = React.useState<File | null>(null);

  return (
    <div>
      <input
        multiple={false}
        type="file"
        onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
      />
      <button
        onClick={() => {
          if (file) {
            apiClient.uploadFile({
              body: {
                thumbnail: file, // <- typed body with "File" type
              },
            });
          }
        }}
      >
        Upload
      </button>
    </div>
  );
};
```

## Server - Express

With Express it is recommend to use the `multer` package to handle the multipart/form-data requests.

ts-rest offers some nice types to help with this, however, we're leaving this up to you to implement with middleware outside of ts-rest.

- `file` is typed as `unknown` <- BYO middleware
- `files` is typed as `unknown` <- BYO middleware
- `body` has had any `File` types removed (so other types are still there)

```ts
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import * as express from 'express';
import * as multer from 'multer';
import { postsContract } from './postsContract';

const upload = multer();
const s = initServer();

const postsRouter = s.router(postsContract, {
  updatePostThumbnail: {
    middleware: [upload.single('thumbnail')],
    handler: async ({ file }) => {
      const thumbnail = file as Express.Multer.File;

      return {
        status: 200,
        body: {
          message: `File ${thumbnail.originalname} successfully!`,
        },
      };
    },
  },
});

const app = express();

createExpressEndpoints(postsContract, postsRouter, app);
```

## Server - Nest

With Nest this is a pretty simple implementation, due to the extensible Decorator driven approach of Nest, you're able to utilize your favourite multipart/form-data middleware, in this case we're following <a href="https://docs.nestjs.com/techniques/file-upload">https://docs.nestjs.com/techniques/file-upload</a> from Nest.

- `body` has had any `File` types removed (so other types are still there)

```ts
// nest
@Controller()
export class AppController implements NestControllerInterface<typeof c> {
  @TsRest(s.route.updateUserAvatar)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUserAvatar(
    @TsRestRequest() { params: { id } }: RequestShapes['updateUserAvatar'],
    @UploadedFile() avatar: Express.Multer.File
  ) {
    return {
      status: 200 as const,
      body: {
        message: `Updated user ${id}'s avatar with ${avatar.originalname}`,
      },
    };
  }
}
```
