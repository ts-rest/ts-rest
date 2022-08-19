import { Controller } from '@nestjs/common';
import { router } from '@ts-rest/example-contracts';
import { Api, ApiDecorator, initNestServer } from '@ts-rest/nest';

const s = initNestServer(router);
type ControllerShape = typeof s.controllerShape;
type R = typeof s.routeShapes;
@Controller()
export class HealthController implements ControllerShape {
  @Api(router.health)
  async health(@ApiDecorator() { query: { mockError } }: R['health']) {
    if (mockError) {
      return { status: 400 as const, data: { message: 'Problems' as const } };
    }

    return { status: 200 as const, data: { message: 'OK' } };
  }
}
