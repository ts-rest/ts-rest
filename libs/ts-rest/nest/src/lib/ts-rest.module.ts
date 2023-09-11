import {
  ConfigurableModuleBuilder,
  Inject,
  MiddlewareConsumer,
  Module,
  Optional,
  RequestMethod,
} from '@nestjs/common';
import { TsRestOptions } from './ts-rest.decorator';

const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: TS_REST_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<TsRestOptions>().build();

export { TS_REST_MODULE_OPTIONS_TOKEN };

@Module({
  exports: [TS_REST_MODULE_OPTIONS_TOKEN],
})
export class TsRestModule extends ConfigurableModuleClass {
  constructor(
    @Optional()
    @Inject(TS_REST_MODULE_OPTIONS_TOKEN)
    private options: TsRestOptions | null
  ) {
    super();
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: any) => {
        req.tsRestOptions = this.options;
        next();
      })
      .forRoutes({
        path: '*',
        method: RequestMethod.ALL,
      });
  }
}
