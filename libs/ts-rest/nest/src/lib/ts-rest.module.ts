import {
  ConfigurableModuleBuilder,
  Inject,
  MiddlewareConsumer,
  Module,
  Optional,
  RequestMethod,
} from '@nestjs/common';
import { MaybeTsRestOptions, TsRestOptions } from './ts-rest-options';

const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: TS_REST_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<TsRestOptions>()
  .setExtras(
    {
      isGlobal: false,
    },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }),
  )
  .build();

export { TS_REST_MODULE_OPTIONS_TOKEN };

@Module({
  exports: [TS_REST_MODULE_OPTIONS_TOKEN],
})
export class TsRestModule extends ConfigurableModuleClass {
  constructor(
    @Optional()
    @Inject(TS_REST_MODULE_OPTIONS_TOKEN)
    private globalOptions: MaybeTsRestOptions,
  ) {
    super();
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: any) => {
        req.tsRestGlobalOptions = this.globalOptions;
        next();
      })
      .forRoutes({
        path: '*',
        method: RequestMethod.ALL,
      });
  }
}
