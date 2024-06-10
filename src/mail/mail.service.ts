import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { MailTemplate } from 'src/interfaces/mail.interface';
import { CustomLogger } from 'src/logger/logger.service';
import { TemplateLoader } from 'src/utils/template-loader.utils';

@Injectable()
export class MailService {
  private templateLoader: TemplateLoader;

  constructor(
    private readonly logger: CustomLogger,
    private readonly configService: ConfigService,
  ) {
    this.templateLoader = new TemplateLoader();
  }

  async sendMail({ to, subject, templatefilename, context }: MailTemplate) {
    const transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
      logger: true,
      debug: true,
    });

    console.log("context >> "+ JSON.stringify(context));

    const template = this.templateLoader.getTemplate(templatefilename);
    const html = template(context);

    const mailOptions = {
      from: 'jeevamahalingam42@gmail.com',
      to: to,
      subject: subject,
      html: html,
    };

    try {
      await transporter.sendMail(mailOptions);
      return "Success";
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.logger.error('Something went wrong!', JSON.stringify(error));
          }
          return "Something went wrong!";
    }
  }
}
