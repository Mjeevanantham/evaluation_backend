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

    // Convert base64 image to inline image
    const image = `<img src="data:image/jpeg;base64,${context.image}" alt="User Image" width="150" height="150" />`;

    // Replace the base64 image in the context with the inline image
    const contextWithInlineImage = {
      ...context,
      image: image,
    };

    const template = this.templateLoader.getTemplate(templatefilename);
    const html = template(contextWithInlineImage);

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
