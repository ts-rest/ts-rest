import { Controller } from '@nestjs/common';
import { router } from '@ts-rest/example-contracts';
import { Api, ApiDecorator, initNestServer } from '@ts-rest/nest';
import { PrismaService } from './prisma.service';

const s = initNestServer(router.users);
type ControllerShape = typeof s.controllerShape;
type R = typeof s.routeShapes;

@Controller()
export class UserController implements ControllerShape {
  constructor(private prisma: PrismaService) {}

  @Api(router.users.getUsers)
  async getUsers(@ApiDecorator() { query }: R['getUsers']) {
    const users = await this.prisma.user.findMany({});

    return users;
  }
}
