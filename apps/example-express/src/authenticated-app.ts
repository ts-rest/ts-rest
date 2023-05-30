import * as express from 'express';
import { apiBlog } from '@ts-rest/example-contracts';
import {
  createExpressEndpoints,
  initServer,
  TsRestRequest,
} from '@ts-rest/express';
import * as bodyParser from 'body-parser';
import { mockOwnedResource, mockPostFixtureFactory } from './fixtures';
import cors = require('cors');
import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import * as passport from 'passport';
import * as _ from 'lodash';
import * as jwt from 'jsonwebtoken';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: string;
    }
  }
}

const JWT_SECRET = 'SUPER_SUPER_SECRET_KEY';

export const SAMPLE_OWNER_JWT = jwt.sign(
  {
    id: 'mock-owner-id',
    role: 'user',
  },
  JWT_SECRET
);

export const SAMPLE_NON_OWNER_JWT = jwt.sign(
  {
    id: 'mock-user-id',
    role: 'user',
  },
  JWT_SECRET
);

export const SAMPLE_GUEST_JWT = jwt.sign(
  {
    id: 'mock-guest-id',
    role: 'guest',
  },
  JWT_SECRET
);

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

passport.use(
  new Strategy(
    {
      secretOrKey: JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromHeader('x-api-key'),
      passReqToCallback: true,
    },
    (req: express.Request, payload: any, done: VerifiedCallback) => {
      const tsRestContext = (req as TsRestRequest<any, any>).tsRest.context;

      if (tsRestContext?.roles && tsRestContext.roles.includes(payload?.role)) {
        return done(null, payload);
      }

      return done(null, false);
    }
  )
);

const s = initServer();
const completedRouter = s
  .context(apiBlog, async ({ req, route }) => {
    return {
      ...route.metadata,
    };
  })
  .router({
    getPost: async ({ params: { id } }) => {
      const post = mockPostFixtureFactory({ id });

      if (!post) {
        return {
          status: 404,
          body: null,
        };
      }

      return {
        status: 200,
        body: post,
      };
    },
    getPosts: async ({ query }) => {
      const posts = [
        mockPostFixtureFactory({ id: '1' }),
        mockPostFixtureFactory({ id: '2' }),
      ];

      return {
        status: 200,
        body: {
          posts,
          count: 0,
          skip: query.skip,
          take: query.take,
        },
      };
    },
    createPost: async ({ body }) => {
      const post = mockPostFixtureFactory(body);

      return {
        status: 201,
        body: post,
      };
    },
    updatePost: async ({ body }) => {
      const post = mockPostFixtureFactory(body);

      return {
        status: 200,
        body: post,
      };
    },
    deletePost: {
      middleware: [
        (req, res, next) => {
          console.log('deletePost middleware - id: ', req.params.id);

          next();
        },
      ],
      handler: async () => {
        return {
          status: 200,
          body: { message: 'Post deleted' },
        };
      },
    },
    testPathParams: async ({ params }) => {
      return {
        status: 200,
        body: params,
      };
    },
  });

createExpressEndpoints(apiBlog, completedRouter, app, {
  middleware: [
    passport.authenticate('jwt', { session: false }),
    (req, res, next) => {
      const context = req.tsRest.context;

      if (context && 'resource' in context) {
        const resourceId = _.get(req, context.identifierPath);
        const resource = mockOwnedResource(context.resource, {
          id: resourceId,
        });

        if (resource.ownerId !== req.user?.id) {
          return res.status(403).json({ message: 'Forbidden' });
        }
      }

      next();
    },
  ],
});

const port = process.env.port || 3334;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);

export default app;
