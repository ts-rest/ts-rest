export const JsonQuerySymbol = Symbol('JsonQuery');

export const JsonQuery = (
  jsonQuery = true
): ClassDecorator & MethodDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(JsonQuerySymbol, jsonQuery, target);
  };
};
