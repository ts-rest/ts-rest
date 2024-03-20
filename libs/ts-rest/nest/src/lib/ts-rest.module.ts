import { ConfigurableModuleBuilder, Module } from '@nestjs/common';
import { TsRestOptions } from './ts-rest-options';

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
export class TsRestModule extends ConfigurableModuleClass {}
