import { IsString, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLinkDto {
  @ApiProperty({
    example: 'My Twitter',
    description: 'Link title',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'https://twitter.com/johndoe',
    description: 'Link URL',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  url?: string;
}
