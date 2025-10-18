import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLinkDto {
  @ApiProperty({ example: 'My Twitter', description: 'Link title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'https://twitter.com/johndoe',
    description: 'Link URL',
  })
  @IsUrl()
  url: string;
}
