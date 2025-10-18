import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User name',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Content creator and tech enthusiast',
    description: 'User bio',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;
}
