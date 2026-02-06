import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { apiBlog } from '@ts-rest/example-contracts';
import { generateOpenApi, SchemaTransformerAsync } from '@ts-rest/open-api';
import cors = require('cors');
import convert from '@openapi-contrib/json-schema-to-openapi-schema';
import { AppModule } from './app/app.module';
import z from 'zod';

export const ZOD_4_ASYNC: SchemaTransformerAsync = async ({ schema }) => {
  if (schema instanceof z.core.$ZodAny) {
    const jsonSchema = z.toJSONSchema(schema);
    return await convert(jsonSchema);
  }
  return null;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3334;

  app.use(cors());

  SwaggerModule.setup(
    'api',
    app,
    generateOpenApi(
      apiBlog,
      {
        info: { title: 'Blog API', version: '0.1' },
      },
      { schemaTransformer: ZOD_4_ASYNC },
    ),
  );

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
