import { Controller, UploadedFile, UseInterceptors } from '@nestjs/common';
import { usersApi } from '@ts-rest/example-microservice/util-users-api';
import {
  Api,
  TsRestRequest,
  nestControllerContract,
  NestControllerInterface,
  NestRequestShapes,
} from '@ts-rest/nest';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';

const c = nestControllerContract(usersApi);
type RequestShapes = NestRequestShapes<typeof c>;

@Controller()
export class AppController implements NestControllerInterface<typeof c> {
  constructor(private readonly appService: AppService) {}

  @Api(c.getUser)
  async getUser(@TsRestRequest() { params: { id } }: RequestShapes['getUser']) {
    return {
      status: 200 as const,
      body: {
        id: id,
        name: 'John Doe',
        email: 'johndoe@gmail.com',
      },
    };
  }

  @Api(c.updateUserAvatar)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUserAvatar(
    @TsRestRequest() { params: { id } }: RequestShapes['updateUserAvatar'],
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
