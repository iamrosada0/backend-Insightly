import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import * as requestWithUserInterface from '../common/interfaces/request-with-user.interface';
import { UnauthorizedException } from '@nestjs/common';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post(':username')
  @ApiOperation({ summary: 'Submit anonymous feedback for a user' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createFeedback(
    @Param('username') username: string,
    @Body() createFeedbackDto: CreateFeedbackDto,
  ) {
    return this.feedbackService.createFeedback(username, createFeedbackDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all feedbacks for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Feedbacks retrieved successfully' })
  async getFeedbacks(
    @Req() req: requestWithUserInterface.RequestWithUser,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.feedbackService.getFeedbacks(
      req.user.id,
      pageNumber,
      limitNumber,
    );
  }
}
