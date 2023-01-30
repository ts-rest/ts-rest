import { SetMetadata } from '@nestjs/common';

export const JsonQuerySymbol = Symbol('JsonQuery');

/**
 * Enable JSON query mode for a controller or a single route
 */
export const JsonQuery = (jsonQuery = true) => {
  return SetMetadata(JsonQuerySymbol, jsonQuery);
};
