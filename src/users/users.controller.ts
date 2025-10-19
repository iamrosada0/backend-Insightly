import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import * as requestWithUserInterface from '../common/interfaces/request-with-user.interface';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../auth/public.decorator';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Req() req: requestWithUserInterface.RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    console.log('Update profile request for user ID:', req.user);
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('links')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Link created successfully' })
  async createLink(
    @Req() req: requestWithUserInterface.RequestWithUser,
    @Body() createLinkDto: CreateLinkDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.usersService.createLink(req.user.id, createLinkDto);
  }

  @Get('links')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Links retrieved successfully' })
  async getLinks(@Req() req: requestWithUserInterface.RequestWithUser) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.usersService.getLinks(req.user.id);
  }

  @Patch('links/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Link updated successfully' })
  async updateLink(
    @Req() req: requestWithUserInterface.RequestWithUser,
    @Param('id') id: string,
    @Body() updateLinkDto: UpdateLinkDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const linkId = parseInt(id, 10);
    if (isNaN(linkId)) {
      throw new BadRequestException('Invalid link ID');
    }
    return this.usersService.updateLink(req.user.id, linkId, updateLinkDto);
  }

  @Delete('links/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Link deleted successfully' })
  async deleteLink(
    @Req() req: requestWithUserInterface.RequestWithUser,
    @Param('id') id: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const linkId = parseInt(id, 10);
    if (isNaN(linkId)) {
      throw new BadRequestException('Invalid link ID');
    }
    return this.usersService.deleteLink(req.user.id, linkId);
  }

  @Get(':username')
  @Public()
  @ApiResponse({
    status: 200,
    description: 'Public profile retrieved successfully',
  })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  @Get()
  @Public()
  @ApiResponse({ status: 200, description: 'All users retrieved successfully' })
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get('me/profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getMyProfile(@Req() req: requestWithUserInterface.RequestWithUser) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.usersService.getUserProfileById(req.user.id);
  }
}
