import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva', description: 'User full name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' })
  name: string;

  @ApiProperty({ example: 'joao_silva', description: 'Unique username' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'O usuário deve ter pelo menos 3 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'O usuário deve conter apenas letras, números ou _',
  })
  username: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  password: string;
}
