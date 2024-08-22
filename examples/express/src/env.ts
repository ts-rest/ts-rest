import * as path from 'node:path';
import * as process from 'node:process';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
});

export const env = {
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  JWT_SECRET: process.env.JWT_SECRET!,
};
