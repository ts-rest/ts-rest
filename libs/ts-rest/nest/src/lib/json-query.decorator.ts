import { SetMetadata } from '@nestjs/common';
import { JsonQuerySymbol } from './constants';

/**
 * Enable JSON query mode for a controller or a single route
 */
export const JsonQuery = (jsonQuery = true) => {
  return SetMetadata(JsonQuerySymbol, jsonQuery);
};
