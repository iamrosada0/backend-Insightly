import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({
    example: 'Great content, keep it up!',
    description: 'Feedback message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
