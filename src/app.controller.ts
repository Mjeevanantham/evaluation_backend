import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { UserDetailsDto } from './dto/userRequest.dto';
import { User } from './schema/user.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseUpdateDataInterceptor } from './interceptor/filevalidation.interceptor';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/send_mail')
  async sendMail(@Body() userDetails: UserDetailsDto): Promise<any> {
    return this.appService.sendMail(userDetails);
  }

  @Post('/add_user')
  @UseInterceptors(ParseUpdateDataInterceptor)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() userDto: UserDetailsDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Image is required and cannot be empty.');
      }
      const user = await this.appService.create(userDto, file);
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

  @Post('export_pdf')
  async generatePdf(@Body() data: UserDetailsDto, @Res() res: Response) {
    try {
      console.log(JSON.stringify(data));
      const pdfBuffer = await this.appService.generatePdf(data);
      console.log(pdfBuffer);
      res.setHeader('Content-Type', 'application/pdf');
      console.log('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${data.name}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      // Handle errors
      res.status(500).json({ message: 'Error generating PDF' });
    }
  }

  @Get('/getuserlist')
  async findAll(): Promise<User[]> {
    return this.appService.findAll();
  }
}
