import { ExamplesObject, ParameterObject, SchemaObject } from 'openapi3-ts';

export const schemaToParameter = (
  schema: SchemaObject,
  where: 'query' | 'header' | 'path',
  required: boolean,
  key: string,
  jsonQuery: boolean,
): ParameterObject => {
  let description: string | undefined = undefined;

  if ('description' in schema) {
    description = schema['description'];
    delete schema['description'];
  }

  let examples: ExamplesObject | undefined = undefined;
  if ('mediaExamples' in schema) {
    examples = schema['mediaExamples'];
    delete schema['mediaExamples'];
  }

  const isDeepObject = 'properties' in schema;

  if (jsonQuery) {
    return {
      name: key,
      in: where,
      ...(description && { description }),
      ...(required && { required }),
      content: {
        'application/json': {
          schema,
          ...(examples && { examples }),
        },
      },
    };
  } else {
    return {
      name: key,
      in: where,
      ...(examples && { examples }),
      ...(description && { description }),
      ...(required && { required }),
      ...(isDeepObject && !jsonQuery && { style: 'deepObject' }),
      schema,
    };
  }
};

/**
 * Convert a @type {SchemaObject} to an array of @type {ParameterObject}
 *
 * @param schema - Legacy Zod3 or any Standard Schema
 * @param where - The location of the parameters
 * @param jsonQuery - Whether the schema is a JSON query
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
      parameters.push(
        schemaToParameter(value, where, requiredSet.has(key), key, jsonQuery),
      );
    }
  } else if (
    schema.oneOf?.every(
      (branch): branch is SchemaObject =>
        'type' in branch && branch.type === 'object',
    )
  ) {
    // A top-level union/discriminatedUnion of objects (e.g. z.union/z.discriminatedUnion
    // used as the whole query/headers schema): flatten to the union of every branch's
    // properties, since OpenAPI's flat `parameters` array has no way to represent
    // "these params only apply for variant X". A property is only marked required if
    // every branch has it as required.
    const branches = schema.oneOf as SchemaObject[];
    const propertySchemasByKey = new Map<string, SchemaObject[]>();

    for (const branch of branches) {
      for (const [key, value] of Object.entries(branch.properties ?? {})) {
        const existing = propertySchemasByKey.get(key) ?? [];
        existing.push(value as SchemaObject);
        propertySchemasByKey.set(key, existing);
      }
    }

    for (const [key, propertySchemas] of propertySchemasByKey) {
      const isRequired = branches.every(
        (branch) => branch.required?.includes(key),
      );

      const propertySchema =
        propertySchemas.length === 1
          ? propertySchemas[0]
          : { oneOf: propertySchemas };

      parameters.push(
        schemaToParameter(propertySchema, where, isRequired, key, jsonQuery),
      );
    }
  }

  return parameters;
};
