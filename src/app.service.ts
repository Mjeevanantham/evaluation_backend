import { Injectable, Logger } from '@nestjs/common';
import { UserDetailsDto } from './dto/userRequest.dto';
import { User } from './schema/user.schema';
import { UserRepository } from './models-repository/user.repository';
import { MailService } from './mail/mail.service';

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

  async create(userDetailsDto: UserDetailsDto): Promise<User> {
    try {
      console.log('userDetailsDto>>>>>> ' + JSON.stringify(userDetailsDto));
      return this.userRepository.create(userDetailsDto);
    } catch (error) {
      console.log('error >>>>>> ' + JSON.stringify(error));

      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
