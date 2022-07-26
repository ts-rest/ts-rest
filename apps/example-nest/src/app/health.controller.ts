import { Controller, Get } from '@nestjs/common';
import { router } from '@tscont/example-contracts';
import { initNestServer } from '@ts-rest/core';

const s = initNestServer(router);
type ControllerShape = typeof s.controllerShape;

@Controller()
export class HealthController implements ControllerShape {
  @Get(s.paths.health)
  async health() {
    return { message: 'OK' };
  }
}
