import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ kabir: 'user@kabir.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ kabir: 'password123', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
