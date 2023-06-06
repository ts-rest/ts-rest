import { assert, describe, expect, it } from 'vitest';
import { transformLegacyNestController } from './nestTransform';
import * as ts from 'typescript';

const doesTsScriptEqual = (input: string, output: string) => {
  const inputSource = ts.createSourceFile(
    'input.ts',
    input,
    ts.ScriptTarget.ES2015,
    true
  );

  const outputSource = ts.createSourceFile(
    'output.ts',
    output,
    ts.ScriptTarget.ES2015,
    true
  );

  expect(ts.createPrinter().printFile(inputSource)).toStrictEqual(
    ts.createPrinter().printFile(outputSource)
  );
};

describe('nestTransform', () => {
  it('should be able to transform a single route', () => {
    const input = `
    import { contract } from '@collective-application/bmo/util-member-api';
    import { Controller, Headers } from '@nestjs/common';
    import {
      nestControllerContract,
      NestControllerInterface,
      NestRequestShapes,
      TsRest,
      TsRestRequest,
    } from '@ts-rest/nest';
    import { StripeEventProcessor } from '../stripe-event-processor.service';
    
    const c = nestControllerContract(contract.b2c);
    type RequestShapes = NestRequestShapes<typeof c>;
    
    @Controller()
    export class MyController implements NestControllerInterface<typeof c> {
      private readonly logger = new Logger(MyController.name);
    
      constructor(private readonly stripeEventProcessor: StripeEventProcessor) {}
    
      @TsRest(c.stripeSubscriptionWebhook)
      async stripeSubscriptionWebhook(
        @Headers('stripe-signature') stripeSignature: string,
        @TsRestRequest() { body }: RequestShapes['stripeSubscriptionWebhook']
      ) {
        this.logger.info({
          message: 'stripeSubscriptionWebhook',
        });
    
        await this.stripeEventProcessor.processWebhook(body, stripeSignature);
    
        return { status: 200 as const, body: null };
      }
    }
    
`;

    const output = transformLegacyNestController(input);

    doesTsScriptEqual(
      output,
      `
      import { contract } from '@collective-application/bmo/util-member-api';
      import { Controller, Headers } from '@nestjs/common';
      import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
      import { StripeEventProcessor } from '../stripe-event-processor.service';
      ;
      @Controller()
      export class MyController {
          constructor(private readonly stripeEventProcessor: StripeEventProcessor) { }
          @TsRestHandler(contract.b2c)
          handler() { return tsRestHandler(contract.b2c, { stripeSubscriptionWebhook: async ({ body, headers: { "stripe-signature": stripeSignature } }) => {
                  this.logger.info({
                      message: 'stripeSubscriptionWebhook',
                  });
                  await this.stripeEventProcessor.processWebhook(body, stripeSignature);
                  return { status: 200, body: null };
              } }); }
          private readonly logger = new Logger(MyController.name);
      }
 `
    );
  });

  it('should be able to transform multiple routes', () => {
    const input = `
    import { contract } from '@collective-application/bmo/util-member-api';
    import { Controller, Headers } from '@nestjs/common';
    import {
      nestControllerContract,
      NestControllerInterface,
      NestRequestShapes,
      TsRest,
      TsRestRequest,
    } from '@ts-rest/nest';
    import { StripeEventProcessor } from '../stripe-event-processor.service';
    
    const c = nestControllerContract(contract.b2c);
    type RequestShapes = NestRequestShapes<typeof c>;
    
    @Controller()
    export class MyController implements NestControllerInterface<typeof c> {
      private readonly logger = new Logger(MyController.name);
    
      constructor(private readonly stripeEventProcessor: StripeEventProcessor) {}
    
      @TsRest(c.stripeSubscriptionWebhook)
      async stripeSubscriptionWebhook(
        @Headers('stripe-signature') stripeSignature: string,
        @TsRestRequest() { body }: RequestShapes['stripeSubscriptionWebhook']
      ) {
        this.logger.info({
          message: 'stripeSubscriptionWebhook',
        });
    
        await this.stripeEventProcessor.processWebhook(body, stripeSignature);
    
        return { status: 200 as const, body: null };
      }

      @TsRest(c.getPosts)
      async getPosts(
        @TsRestRequest() { params: { id } }: RequestShapes['stripeSubscriptionWebhook']
      ) {
        return {
          status: 200 as const,
          post: { id }
        }
      }
    }
    `;

    const output = transformLegacyNestController(input);

    doesTsScriptEqual(
      output,
      `
    import { contract } from '@collective-application/bmo/util-member-api';
  import { Controller, Headers } from '@nestjs/common';
  import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
  import { StripeEventProcessor } from '../stripe-event-processor.service';
  ;
  @Controller()
  export class MyController {
      constructor(private readonly stripeEventProcessor: StripeEventProcessor) { }
      @TsRestHandler(contract.b2c)
      handler() {
          return tsRestHandler(contract.b2c, { stripeSubscriptionWebhook: async ({ body, headers: { "stripe-signature": stripeSignature } }) => {
                  this.logger.info({
                      message: 'stripeSubscriptionWebhook',
                  });
                  await this.stripeEventProcessor.processWebhook(body, stripeSignature);
                  return { status: 200, body: null };
              }, getPosts: async ({ params: { id } }) => {
                  return {
                      status: 200,
                      post: { id }
                  };
              } });
      }
      private readonly logger = new Logger(MyController.name);
  }`
    );
  });
});
