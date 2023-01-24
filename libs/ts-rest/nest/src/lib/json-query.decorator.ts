export const JsonQuerySymbol = Symbol('JsonQuery');

/**
 * Enable JSON query mode for a controller or a single route
 */
export const JsonQuery = (
  jsonQuery = true
): ClassDecorator & MethodDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(JsonQuerySymbol, jsonQuery, target);
  };
};
