import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';
import { UserDetailsDto } from './dto/userRequest.dto';
import { User } from './schema/user.schema';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/send_mail')
  async sendMail(@Body() userDetails: UserDetailsDto): Promise<any> {
    return this.appService.sendMail(userDetails);
  }

  @Post('/add_user')
  async create(@Body() userDto: UserDetailsDto) {
    try {
      const user = await this.appService.create(userDto);
      return user;
    } catch (error) {
      const parsedError = JSON.stringify(error);
      if (parsedError.indexOf('11000') !== -1) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Email already exists',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Something went wrong',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/getuserlist')
  async findAll(): Promise<User[]> {
    return this.appService.findAll();
  }
}
