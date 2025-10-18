import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async createFeedback(username: string, createFeedbackDto: CreateFeedbackDto) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.feedback.create({
      data: {
        text: createFeedbackDto.message,
        userId: user.id,
      },
    });
  }
  async getFeedbacks(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }
}
