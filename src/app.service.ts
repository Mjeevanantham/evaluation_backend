import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserDetailsDto } from './dto/userRequest.dto';
import { User } from './schema/user.schema';
import { UserRepository } from './models-repository/user.repository';
import { MailService } from './mail/mail.service';
import { BlobServiceClient } from '@azure/storage-blob';
import {
  from,
  map,
  catchError,
  throwError,

} from 'rxjs';
import { STATUS_CODES } from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as pdf from 'html-pdf';

@Injectable()
export class AppService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
    private readonly mailService: MailService,
  ) {}

  async sendMail(userDetails: UserDetailsDto): Promise<any> {
    console.log('Details from front-end >>>>>>>>>>> ' + userDetails.name);

    return this.mailService.sendMail({
      to: userDetails.email,
      subject: `Welcome Mr/Ms ${userDetails.name} `,
      templatefilename: 'welcome',
      context: userDetails,
    });
  }

  async sendMailByID(id: string): Promise<any> {
    console.log('Details from front-end >>>>>>>>>>> ' + id);

    const userDetails = await this.userRepository.findOneById(id, {});

    console.log('userDetails >>>>>>>>>>> ' + userDetails);
    return this.mailService.sendMail({
      to: userDetails.email,
      subject: `Welcome Mr/Ms ${userDetails.name} `,
      templatefilename: 'welcome',
      context: userDetails,
    });
  }

  async exportPdfByID(id: string): Promise<any> {
    const userDetails = await this.userRepository.findOneById(id, {});

    return userDetails;
  }

  async create(userDetailsDto: UserDetailsDto, image: any): Promise<User> {
    try {
      console.log('userDetailsDto>>>>>> ' + JSON.stringify(userDetailsDto));

      const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING,
      );
      const containerClient = blobServiceClient.getContainerClient(
        process.env.AZURE_STORAGE_CONTAINER_NAME,
      );

      const blobName = userDetailsDto.name;

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(image.buffer, image.buffer.length);

      const blobUrl = blockBlobClient.url;

      const newUser: any = {
        ...userDetailsDto,
        image: blobUrl,
      };

      return await this.userRepository.createOne(newUser);
    } catch (error) {
      console.log('error >>>>>> ' + JSON.stringify(error));
      throw error;
    }
  }

  async findAll(): Promise<any> {
    return from(this.userRepository.findManyByFilter({}))
      .pipe(
        map((dataList) => {
          if (dataList && dataList.data.length > 0) {
            return {
              data: dataList.data,
              count: dataList.total_count,
              message: `data not found`,
              status_code: STATUS_CODES.FOUND,
            };
          } else {
            return {
              data: [],
              message: `data not found`,
              status_code: HttpStatus.UNPROCESSABLE_ENTITY,
            };
          }
        }),
        catchError((error) => {
          if (error instanceof Error) {
            this.logger.error(
              {
                message: error.name,
                filepath: __filename,
                functionname: 'findAll', // Corrected to refer to the current function name
              },
              error.stack ?? '',
              'error',
            );
          }
          return throwError(() => error);
        }),
      )
      .toPromise(); // Ensure the observable is converted back to a Promise
  }

  async generatePdf(data: UserDetailsDto): Promise<Buffer> {
    const templatePath = path.resolve(
      __dirname,
      'utils',
      'templates',
      'template.html',
    );
    console.log('templatePath>>>> ' + templatePath);

    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    console.log('templateHtml loaded successfully');

    const populatedHtml = this.populateHtmlTemplate(templateHtml, data);
    console.log('populatedHtml>>>> ' + populatedHtml);

    return new Promise((resolve, reject) => {
      pdf
        .create(populatedHtml, { format: 'Letter' })
        .toBuffer((err, buffer) => {
          if (err) {
            console.error('Error generating PDF:', err);
            reject(err);
          } else {
            console.log('PDF generated successfully');
            resolve(buffer);
          }
        });
    });
  }

  private populateHtmlTemplate(template: string, data: UserDetailsDto): string {
    console.log(
      'Populating HTML template with data >>>>>>> ' + JSON.stringify(data),
    );

    return template
      .replace('{{name}}', data.name)
      .replace('{{email}}', data.email)
      .replace('{{age}}', data.age.toString())
      .replace('{{role}}', data.role)
      .replace('{{companyname}}', data.companyname)
      .replace('{{status}}', data.status);
  }
}
