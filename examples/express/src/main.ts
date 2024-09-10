import './env';

import process from 'node:process';
import { apiBlog } from '@ts-rest-examples/contracts';
import { ResponseValidationError } from '@ts-rest/core';
import type { TsRestRequest } from '@ts-rest/express';
import { generateOpenApi } from '@ts-rest/open-api';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import httpError from 'http-errors';
import passport from 'passport';
import { ExtractJwt, Strategy, type VerifiedCallback } from 'passport-jwt';
import { serve, setup } from 'swagger-ui-express';
import { env } from './env';
import { authenticatedBlogRouter } from './express-routers/authenticated-blog';
import { regularBlogRouter } from './express-routers/blog';
import { tsBlog } from './express-routers/ts-blog';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
passport.use(
  new Strategy(
    {
      secretOrKey: env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromHeader('x-api-key'),
      passReqToCallback: true,
    },
    (
      req: TsRestRequest<typeof apiBlog>,
      payload: any,
      done: VerifiedCallback
    ) => {
      const routeMetadata = req.tsRestRoute.metadata;

      if (routeMetadata.roles.includes(payload?.role)) {
        return done(null, payload);
      }

      return done(new httpError.Forbidden('You do not have permission'));
    }
  )
);

const openapi = generateOpenApi(apiBlog, {
  info: { title: 'Play API', version: '0.1' },
});

const apiDocs = express.Router();

apiDocs.use(serve);
apiDocs.get('/', setup(openapi));

app.use('/api-docs', apiDocs);
app.use('/api', tsBlog);
app.use('/api/blog', regularBlogRouter);
app.use('/api/internal', authenticatedBlogRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ResponseValidationError) {
    console.error(err.cause);
  }

  if (httpError.isHttpError(err)) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }
});

const port = process.env.PORT ?? 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);

export default app;
