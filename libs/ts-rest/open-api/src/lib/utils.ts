import { SchemaObject, MediaTypeObject, ReferenceObject } from 'openapi3-ts';

export const convertSchemaObjectToMediaTypeObject = (
  input: SchemaObject,
): MediaTypeObject => {
  const { mediaExamples: examples, ...schema } = input;

  return {
    schema,
    ...(examples && { examples }),
  };
};

export const extractReferenceSchemas = (
  schema: SchemaObject,
  referenceSchemas: { [id: string]: SchemaObject },
): SchemaObject => {
  if (schema.allOf) {
    schema.allOf = schema.allOf?.map((subSchema) =>
      extractReferenceSchemas(subSchema, referenceSchemas),
    );
  }

  if (schema.anyOf) {
    schema.anyOf = schema.anyOf?.map((subSchema) =>
      extractReferenceSchemas(subSchema, referenceSchemas),
    );
  }

  if (schema.oneOf) {
    schema.oneOf = schema.oneOf?.map((subSchema) =>
      extractReferenceSchemas(subSchema, referenceSchemas),
    );
  }

  if (schema.not) {
    schema.not = extractReferenceSchemas(schema.not, referenceSchemas);
  }

  if (schema.items) {
    schema.items = extractReferenceSchemas(schema.items, referenceSchemas);
  }

  if (schema.properties) {
    schema.properties = Object.entries(schema.properties).reduce<{
      [p: string]: SchemaObject | ReferenceObject;
    }>((prev, [propertyName, schema]) => {
      prev[propertyName] = extractReferenceSchemas(schema, referenceSchemas);
      return prev;
    }, {});
  }

  if (schema.additionalProperties) {
    schema.additionalProperties =
      typeof schema.additionalProperties != 'boolean'
        ? extractReferenceSchemas(schema.additionalProperties, referenceSchemas)
        : schema.additionalProperties;
  }

  if (schema.title) {
    const nullable = schema.nullable;
    schema.nullable = undefined;
    if (schema.title in referenceSchemas) {
      if (
        JSON.stringify(referenceSchemas[schema.title]) !==
        JSON.stringify(schema)
      ) {
        throw new Error(
          `Schema title '${schema.title}' already exists with a different schema`,
        );
      }
    } else {
      referenceSchemas[schema.title] = schema;
    }

    if (nullable) {
      schema = {
        nullable: true,
        allOf: [
          {
            $ref: `#/components/schemas/${schema.title}`,
          },
        ],
      };
    } else {
      schema = {
        $ref: `#/components/schemas/${schema.title}`,
      };
    }
  }
  return schema;
};
