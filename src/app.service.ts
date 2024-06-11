import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserDetailsDto } from './dto/userRequest.dto';
import { User } from './schema/user.schema';
import { UserRepository } from './models-repository/user.repository';
import { MailService } from './mail/mail.service';
import { BlobServiceClient } from '@azure/storage-blob';
import * as PDFDocument from 'pdfkit';
import axios from 'axios';
import {
  // switchMap,
  from,
  map,
  catchError,
  throwError,
  // Observable,
  // of,
} from 'rxjs';
import { STATUS_CODES } from 'http';
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
    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      // Add event listeners to gather the PDF data
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      try {
        doc.fontSize(50).fillColor('lightgray').opacity(0.3);

        // Add watermark
        doc
          .text('Confidential', 100, 300, { angle: 45 })
          .opacity(1)
          .fillColor('black');

        // Add logo
        const logoUrl =
          'https://media.licdn.com/dms/image/D560BAQFu4eh9Yj4IDg/company-logo_200_200/0/1684420879029/aaludratech_logo?e=2147483647&v=beta&t=lc2WLP9RsG8YHo4EQXprjGguhqMl9Mbpjij-5RADtVM';
        try {
          const logoResponse = await axios.get(logoUrl, {
            responseType: 'arraybuffer',
          });
          const logoBuffer = Buffer.from(logoResponse.data, 'binary');
          doc.image(logoBuffer, 50, 50, { width: 100 }).moveDown(0.5);
        } catch (error) {
          console.error('Error loading logo:', error);
        }

        // Add title
        doc.fontSize(20).text('Resume', { align: 'center' }).moveDown(0.5);
        doc.moveTo(50, 160).lineTo(550, 160).stroke();

        // Add user details
        const labelX = 50,
          valueX = 150;
        doc
          .fontSize(16)
          .text('Name:', labelX, 180)
          .text(data.name, valueX, 180);
        doc
          .fontSize(16)
          .text('Email:', labelX, 200)
          .fillColor('blue')
          .text(data.email, valueX, 200, { link: `mailto:${data.email}` })
          .fillColor('black');
        doc
          .fontSize(16)
          .text('Age:', labelX, 220)
          .text(data.age.toString(), valueX, 220);
        doc
          .fontSize(16)
          .text('Role:', labelX, 240)
          .text(data.roll, valueX, 240);
        doc
          .fontSize(16)
          .text('Company:', labelX, 260)
          .text(data.companyname, valueX, 260);

        // Add user image
        try {
          const imageResponse = await axios.get(data.image, {
            responseType: 'arraybuffer',
          });
          const imgBuffer = Buffer.from(imageResponse.data, 'binary');
          doc
            .image(imgBuffer, 400, 180, { width: 100, height: 150 })
            .moveDown(0.9);
        } catch (error) {
          console.error('Error loading image:', error);
          doc.text('Error loading image').moveDown(0.5);
        }

        // Add status
        doc
          .fontSize(16)
          .text('Status:', labelX, 280)
          .text(data.status, valueX, 280);

        // Draw a horizontal line
        doc.moveTo(50, 300).lineTo(550, 300).stroke();

        // Add agreement and company details
        doc.moveDown(1).fontSize(14).text('Agreement:');
        doc
          .fontSize(12)
          .text(
            'This document is confidential and intended solely for the use of the individual to whom it is addressed. If you have received this document in error, please notify the sender immediately and delete it from your system.',
          );
        doc.moveDown(1).fontSize(14).text('About the Company:');
        doc
          .fontSize(12)
          .text(
            'ATS is a leading company in innovative solutions, providing top-notch services to our clients worldwide. Our mission is to deliver excellence in every project we undertake.',
          );

        // Finalize the PDF
        doc.end();
      } catch (error) {
        console.error('Error generating PDF:', error);
        reject(error);
      }
    });
  }
}
