import * as v from 'valibot';
import { initContract } from '@ts-rest/core';
import { generateOpenApiAsync } from './ts-rest-open-api';
import { VALIBOT_ASYNC } from './parsers/test-helpers';

const c = initContract();

const PostContentTitleSchema = v.object({
  type: v.literal('title'),
  title: v.string(),
});

const PostContentContentSchema = v.object({
  type: v.literal('content'),
  content: v.string(),
});

const PostContentImageSchema = v.object({
  type: v.literal('image'),
  imageUrl: v.pipe(
    v.string(),
    v.nonEmpty('Please enter your url.'),
    v.url('The url is badly formatted.'),
    v.endsWith('.com', 'Only ".com" domains are allowed.'),
  ),
});

const PostContentSchema = v.union([
  PostContentTitleSchema,
  PostContentContentSchema,
  PostContentImageSchema,
]);

const PostSchema = v.object({
  id: v.number(),
  title: v.string(),
  content: v.pipe(
    v.array(PostContentSchema),
    v.minLength(1, 'At least one content item is required'),
  ),
});

const IdPathParam = v.pipe(
  v.string(),
  v.transform((i) => Number(i)),
  v.integer(),
  v.description('The id of the post'),
);

const contract = c.router({
  updateVisibility: {
    method: 'POST',
    path: `/posts/:id/visibility/:visibility`,
    pathParams: v.object({
      id: IdPathParam,
      visibility: v.picklist(['public', 'private']),
    }),
    body: v.object({
      bodyProperty: v.array(v.string()),
    }),
    responses: {
      200: v.object({
        visibility: v.string(),
      }),
    },
  },
  updatePost: {
    method: 'PUT',
    path: `/posts/:id`,
    pathParams: v.object({
      id: IdPathParam,
    }),
    body: PostSchema,
    responses: {
      200: PostSchema,
    },
  },
});

describe('standard schema', () => {
  it('async valibot schema', async () => {
    const openApiSchema = await generateOpenApiAsync(
      contract,
      {
        info: {
          title: 'Blog API',
          version: '0.1',
        },
      },
      {
        schemaTransformer: VALIBOT_ASYNC,
      },
    );

    // Write to FS
    // fs.writeFileSync(
    //   'valibot-openapi.json',
    //   JSON.stringify(openApiSchema, null, 2),
    // );

    const schema = {
      type: 'object',
      properties: {
        id: { type: 'number' },
        title: { type: 'string' },
        content: {
          type: 'array',
          minItems: 1,
          items: {
            anyOf: [
              {
                type: 'object',
                properties: {
                  type: { enum: ['title'] },
                  title: { type: 'string' },
                },
                required: ['type', 'title'],
              },
              {
                type: 'object',
                properties: {
                  type: { enum: ['content'] },
                  content: { type: 'string' },
                },
                required: ['type', 'content'],
              },
              {
                type: 'object',
                properties: {
                  type: { enum: ['image'] },
                  imageUrl: {
                    type: 'string',
                    format: 'uri',
                    minLength: 1,
                  },
                },
                required: ['type', 'imageUrl'],
              },
            ],
          },
        },
      },
      required: ['id', 'title', 'content'],
    };

    expect(openApiSchema.paths['/posts/{id}']).toStrictEqual({
      put: {
        deprecated: undefined,
        description: undefined,
        parameters: [
          {
            in: 'path',
            name: 'id',
            description: 'The id of the post',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema,
            },
          },
          description: 'Body',
        },
        responses: {
          '200': {
            content: {
              'application/json': {
                schema,
              },
            },
            description: '200',
          },
        },
        summary: undefined,
        tags: [],
      },
    });

    expect(
      openApiSchema.paths['/posts/{id}/visibility/{visibility}'],
    ).toStrictEqual({
      post: {
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            description: 'The id of the post',
            schema: {
              type: 'integer',
            },
          },
          {
            in: 'path',
            name: 'visibility',
            required: true,
            schema: {
              enum: ['public', 'private'],
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                properties: {
                  bodyProperty: {
                    items: {
                      type: 'string',
                    },
                    type: 'array',
                  },
                },
                required: ['bodyProperty'],
                type: 'object',
              },
            },
          },
          description: 'Body',
        },
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  properties: {
                    visibility: {
                      type: 'string',
                    },
                  },
                  required: ['visibility'],
                  type: 'object',
                },
              },
            },
            description: '200',
          },
        },
        summary: undefined,
        deprecated: undefined,
        description: undefined,
        tags: [],
      },
    });
  });
});
