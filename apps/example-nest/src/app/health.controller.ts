import { Controller } from '@nestjs/common';
import { router } from '@ts-rest/example-contracts';
import { Api, initNestServer } from '@ts-rest/nest';

const s = initNestServer(router);
type ControllerShape = typeof s.controllerShape;

@Controller()
export class HealthController implements ControllerShape {
  @Api(router.health)
  async health() {
    return { message: 'OK' };
  }
}
