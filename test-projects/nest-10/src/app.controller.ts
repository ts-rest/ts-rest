import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { AppService } from './app.service';
import { contract } from './contract';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @TsRestHandler(contract)
  handler() {
    return tsRestHandler(contract, {
      getHello: async () => {
        return {
          status: 200,
          body: this.appService.getHello(),
        };
      },
    });
  }
}
