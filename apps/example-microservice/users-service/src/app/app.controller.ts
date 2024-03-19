import { Controller, UploadedFile, UseInterceptors } from '@nestjs/common';
import { usersApi } from '@ts-rest/example-microservice/util-users-api';
import {
  TsRestRequest,
  nestControllerContract,
  NestControllerInterface,
  NestRequestShapes,
  TsRest,
} from '@ts-rest/nest';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';

const c = nestControllerContract(usersApi);
type RequestShapes = NestRequestShapes<typeof c>;

@Controller()
export class AppController implements NestControllerInterface<typeof c> {
  constructor(private readonly appService: AppService) {}

  @TsRest(c.getUser)
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

  @TsRest(c.updateUserAvatar)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUserAvatar(
    @TsRestRequest() { params: { id } }: RequestShapes['updateUserAvatar'],
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return {
      status: 200 as const,
      body: {
        message: `Updated user ${id}'s avatar with ${avatar.originalname}`,
      },
    };
  }
}
