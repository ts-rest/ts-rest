export const ParseResponsesSymbol = Symbol('ts-rest-parse-routes-responses');

export const ParseResponses = (
  parseResponses = true
): ClassDecorator & MethodDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(ParseResponsesSymbol, parseResponses, target);
  };
};
