import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { router } from '@tscont/example-contracts';
import { initNestServer } from 'tscont';

const s = initNestServer(router);
type ControllerShape = typeof s.controllerShape;

@Controller()
export class HealthController implements ControllerShape {
  constructor(private readonly appService: AppService) {}

  @Get(s.paths.health)
  async health() {
    return { message: 'OK' };
  }
}
