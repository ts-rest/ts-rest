import { Controller, UploadedFile, UseInterceptors } from '@nestjs/common';
import { usersApi } from '@ts-rest/example-microservice/util-users-api';
import { Api, ApiDecorator, initNestServer } from '@ts-rest/nest';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';

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

  @Api(s.route.updateUserAvatar)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUserAvatar(
    @ApiDecorator() { params: { id } }: RouteShape['updateUserAvatar'],
    @UploadedFile() avatar: Express.Multer.File
  ) {
    return {
      status: 200 as const,
      body: {
        message: `Updated user ${id}'s avatar with ${avatar.originalname}`,
      },
    };
  }
}
