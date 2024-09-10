import { apiBlog } from '@ts-rest-examples/contracts';
import { createExpressEndpoints } from '@ts-rest/express';
import express from 'express';
import { blogRouter } from '../routers/blog';

export const regularBlogRouter = express.Router();

createExpressEndpoints(apiBlog, blogRouter, regularBlogRouter);
