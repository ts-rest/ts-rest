import { Controller } from '@nestjs/common';
import { routerBasic } from '@ts-rest/example-contracts';
import { Api, ApiDecorator, initNestServer } from '@ts-rest/nest';
import { PrismaService } from '../prisma.service';

const s = initNestServer(routerBasic);
type ControllerShape = typeof s.controllerShape;
type R = typeof s.routeShapes;

@Controller()
export class BasicUserController implements ControllerShape {
  constructor(private prisma: PrismaService) {}

  @Api(routerBasic.user)
  async user(@ApiDecorator() { params }: R['user']) {
    const user = await this.prisma.user.findUnique({
      where: { id: params.id },
    });

    return {
      status: 200 as const,
      data: user,
    };
  }

  @Api(routerBasic.updateUser)
  async updateUser(@ApiDecorator() { body, params }: R['updateUser']) {
    const { id } = params;
    const { name, email } = body;

    const user = await this.prisma.user.update({
      where: { id },
      data: { name: name || undefined, email: email || undefined },
    });

    // Error gracefully handled by tREST
    if (email === 'bad-name') {
      return {
        status: 400 as const,
        data: { message: 'Bad Name' },
      };
    }

    // Test something not handled by tREST
    if (email === 'internal-server-error') {
      throw new Error('Internal Server Error');
    }

    return {
      status: 200 as const,
      data: user,
    };
  }
}
