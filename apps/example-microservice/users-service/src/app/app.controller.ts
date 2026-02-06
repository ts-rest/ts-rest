import { Controller, UploadedFile, UseInterceptors } from '@nestjs/common';
import { usersApi } from '@ts-rest/example-microservice/util-users-api';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import 'multer';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @TsRestHandler(usersApi.getUser)
  async getUser() {
    return tsRestHandler(usersApi.getUser, async ({ params: { id } }) => {
      return {
        status: 200,
        body: {
          id: id,
          name: 'John Doe',
          email: 'johndoe@gmail.com',
        },
      };
    });
  }

  @TsRestHandler(usersApi.updateUserAvatar)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUserAvatar(@UploadedFile() avatar: Express.Multer.File) {
    return tsRestHandler(
      usersApi.updateUserAvatar,
      async ({ params: { id } }) => {
        return {
          status: 200 as const,
          body: {
            message: `Updated user ${id}'s avatar with ${avatar.originalname}`,
          },
        };
      },
    );
  }
}
