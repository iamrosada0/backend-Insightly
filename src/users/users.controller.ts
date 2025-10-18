import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../auth/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    console.log('Update profile request for user ID:', req.user);
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('links')
  @ApiOperation({ summary: 'Create a new link' })
  @ApiResponse({ status: 201, description: 'Link created successfully' })
  async createLink(
    @Req() req: RequestWithUser,
    @Body() createLinkDto: CreateLinkDto,
  ) {
    return this.usersService.createLink(req.user.id, createLinkDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('links')
  @ApiOperation({ summary: 'Get all links for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Links retrieved successfully' })
  async getLinks(@Req() req: RequestWithUser) {
    return this.usersService.getLinks(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Put('links/:id')
  @ApiOperation({ summary: 'Update a link' })
  @ApiResponse({ status: 200, description: 'Link updated successfully' })
  async updateLink(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateLinkDto: UpdateLinkDto,
  ) {
    return this.usersService.updateLink(
      req.user.id,
      parseInt(id, 10),
      updateLinkDto,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Delete('links/:id')
  @ApiOperation({ summary: 'Delete a link' })
  @ApiResponse({ status: 200, description: 'Link deleted successfully' })
  async deleteLink(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.usersService.deleteLink(req.user.id, parseInt(id, 10));
  }

  @Get(':username')
  @Public()
  @ApiOperation({ summary: 'Get public profile by username' })
  @ApiResponse({
    status: 200,
    description: 'Public profile retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('me/profile')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getMyProfile(@Req() req: RequestWithUser) {
    return this.usersService.getUserProfileById(req.user.id);
  }
}
