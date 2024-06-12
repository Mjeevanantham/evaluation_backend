import { IsNotEmpty, IsString } from 'class-validator';

export class UserDetailsDto {
  @IsString({ message: 'Name must be a string.' })
  @IsNotEmpty({ message: 'Name is required and cannot be empty.' })
  name: string;

  @IsString({ message: 'Email must be a string.' })
  @IsNotEmpty({ message: 'Email is required and cannot be empty.' })
  email: string;

  @IsString({ message: 'Age must be a string.' })
  @IsNotEmpty({ message: 'Age is required and cannot be empty.' })
  age: string;

  @IsString({ message: 'Role must be a string.' })
  @IsNotEmpty({ message: 'Role is required and cannot be empty.' })
  role: string;

  @IsString({ message: 'Company name must be a string.' })
  @IsNotEmpty({ message: 'Company name is required and cannot be empty.' })
  companyname: string;
  
  image?: string;

  __v?:any;

  status?:any;


}
