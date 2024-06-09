import { IsNotEmpty, IsString, IsBase64, IsOptional } from 'class-validator';

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

  @IsString({ message: 'Roll must be a string.' })
  @IsNotEmpty({ message: 'Roll is required and cannot be empty.' })
  roll: string;

  @IsString({ message: 'Company name must be a string.' })
  @IsNotEmpty({ message: 'Company name is required and cannot be empty.' })
  companyname: string;

  @IsBase64()
  @IsNotEmpty({ message: 'Image is required and cannot be empty.' })
  @IsOptional()
  image: string;
}
