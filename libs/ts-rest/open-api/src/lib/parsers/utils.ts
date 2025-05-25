import { ExamplesObject, ParameterObject, SchemaObject } from 'openapi3-ts';

/**
 * Convert a @type {SchemaObject} to an array of @type {ParameterObject}
 *
 * @param schema - Legacy Zod3 or any Standard Schema
 * @param where - The location of the parameters
 * @returns The parameters for the schema
 */
export const schemaObjectToParameters = (
  schema: SchemaObject,
  where: 'query' | 'header' | 'path',
  jsonQuery = false,
): ParameterObject[] => {
  const parameters: ParameterObject[] = [];

  if (schema.type === 'object') {
    const requiredSet = new Set(schema.required ?? []);
    const properties = schema.properties;

    if (!properties) {
      return [];
    }

    for (const [key, value] of Object.entries(properties)) {
      let description: string | undefined = undefined;

      if ('description' in value) {
        description = value['description'];
        delete value['description'];
      }

      let examples: ExamplesObject | undefined = undefined;
      if ('mediaExamples' in value) {
        examples = value['mediaExamples'];
        delete value['mediaExamples'];
      }

      const isDeepObject = 'properties' in value;

      if (jsonQuery) {
        parameters.push({
          name: key,
          in: where,
          ...(description && { description }),
          ...(requiredSet.has(key) && { required: true }),
          content: {
            'application/json': {
              schema: value,
              ...(examples && { examples }),
            },
          },
        });
      } else {
        parameters.push({
          name: key,
          in: where,
          ...(examples && { examples }),
          ...(description && { description }),
          ...(requiredSet.has(key) && { required: true }),
          ...(isDeepObject && !jsonQuery && { style: 'deepObject' }),
          schema: value,
        });
      }
    }
  }

  return parameters;
};
