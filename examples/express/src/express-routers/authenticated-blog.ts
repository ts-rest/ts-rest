import { apiBlog } from '@ts-rest-examples/contracts';
import { createExpressEndpoints } from '@ts-rest/express';
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import httpError from 'http-errors';
import _ from 'lodash';
import passport from 'passport';
import { mockOwnedResource } from '../lib/fixtures';
import { PassportAuthenticationError } from '../lib/passport-authentication-error';
import { blogRouter } from '../routers/blog';

export const authenticatedBlogRouter = express.Router();

createExpressEndpoints(apiBlog, blogRouter, authenticatedBlogRouter, {
  requestValidationErrorHandler: 'combined',
  globalMiddleware: [
    passport.authenticate('jwt', { session: false, failWithError: true }),
    (req, res, next) => {
      const routeMetadata = req.tsRestRoute.metadata;

      if ('resource' in routeMetadata) {
        const resourceId = _.get(req, routeMetadata.identifierPath);
        const resource = mockOwnedResource(routeMetadata.resource, {
          id: resourceId,
        });

        if (resource.ownerId !== req.user?.id) {
          return next(
            new httpError.Forbidden('You are not the owner of this resource')
          );
        }
      }

      next();
    },
  ],
});

authenticatedBlogRouter.use(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof PassportAuthenticationError) {
      return res.status(err.status).json({ message: err.message });
    }

    return next(err);
  }
);
