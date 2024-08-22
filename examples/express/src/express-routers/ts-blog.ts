import { contractTs } from '@ts-rest-examples/contracts';
import { createExpressEndpoints } from '@ts-rest/express';
import express from 'express';
import { tsRouter } from '../routers/ts-router';

export const tsBlog = express.Router();

createExpressEndpoints(contractTs, tsRouter, tsBlog, {
  jsonQuery: true,
});
