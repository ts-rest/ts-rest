import { Controller, Get } from '@nestjs/common';
import { usersApi } from '@ts-rest/example-microservice/util-users-api';
import { Api, ApiDecorator, initNestServer } from '@ts-rest/nest';
import { AppService } from './app.service';

const s = initNestServer(usersApi);
type ControllerShape = typeof s.controllerShape;
type RouteShape = typeof s.routeShapes;

@Controller()
export class AppController implements ControllerShape {
  constructor(private readonly appService: AppService) {}

  @Api(s.route.getUser)
  async getUser(@ApiDecorator() { params: { id } }: RouteShape['getUser']) {
    return {
      status: 200 as const,
      body: {
        id: id,
        name: 'John Doe',
        email: 'johndoe@gmail.com',
      },
    };
  }
}
