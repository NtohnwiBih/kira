import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard }               from '../../auth/guards';
import { RolesGuard }                 from '../../auth/guards';
import { Roles, CurrentUser, Public } from '../../auth/decorators';
import type { AuthenticatedUser }          from '../../auth/interfaces';
import {
  CreateRestaurantDto,
  UpdateRestaurantDto,
  ChangeAvailabilityDto,
  RestaurantResponseDto,
  MessageResponseDto,
  PaginationDto,
  FindManyRestaurantsQueryDto,
} from '../dto/restaurant.dto';

import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from '../dto/swagger-error.dto';
import { RestaurantOwnershipGuard } from '../guards/restaurant-owner.guard';
import { ManagerPermissionGuard } from '../guards/manager-permission.guard';
import { RequiresPermission } from '../decorators/restaurant.decorators';
import { RestaurantService } from '../services/restaurant.service';
import { UserRole } from 'generated/prisma/client';

@ApiTags('Restaurants')
@ApiBearerAuth('BearerAuth')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  // ── POST /restaurants ─────────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @ApiOperation({
    summary: 'Create a restaurant',
    description:
      'Creates a new restaurant owned by the authenticated user. ' +
      'Only `RESTAURANT_OWNER`, `ADMIN`, and `SUPER_ADMIN` roles can create restaurants. ' +
      'One owner may own multiple restaurants. ' +
      'The slug is auto-generated from the restaurant name.',
  })
  @ApiResponse({ status: 201, description: 'Restaurant created', type: RestaurantResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error', type: ValidationErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthenticated', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Insufficient role', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Slug already taken', type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: 'Too many requests (5/hour)', type: ErrorResponseDto })
  async create(
    @Body() dto: CreateRestaurantDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RestaurantResponseDto> {
    return this.restaurantService.create(dto, user.id);
  }

  // ── GET /restaurants ──────────────────────────────────────────────────────
  @Get()
  @Public()
  @ApiOperation({
    summary: 'List open restaurants',
    description: 'Public endpoint — returns paginated list of OPEN, active, verified restaurants.',
  })
  @ApiResponse({ status: 200, description: 'Paginated restaurant list' })
    async findMany(
    @Query() query: FindManyRestaurantsQueryDto,
    ) {
    return this.restaurantService.findMany({
        city:  query.city,
        page:  query.page  ?? 1,
        limit: query.limit ?? 20,
    });
    }

  // ── GET /restaurants/mine ─────────────────────────────────────────────────
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "List the authenticated owner's restaurants",
    description: 'Returns all restaurants (any status) owned by the current user.',
  })
  @ApiResponse({ status: 200, description: 'Owner restaurant list', type: [RestaurantResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthenticated', type: ErrorResponseDto })
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RestaurantResponseDto[]> {
    return this.restaurantService.findByOwner(user.id);
  }

  // ── GET /restaurants/:id ──────────────────────────────────────────────────
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a restaurant by ID' })
  @ApiParam({ name: 'id', description: 'Restaurant UUID' })
  @ApiResponse({ status: 200, type: RestaurantResponseDto })
  @ApiResponse({ status: 404, description: 'Restaurant not found', type: ErrorResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RestaurantResponseDto> {
    return this.restaurantService.findById(id);
  }

  // ── GET /restaurants/:id/is-open ──────────────────────────────────────────
  @Get(':id/is-open')
  @Public()
  @ApiOperation({
    summary: 'Real-time open/closed check',
    description:
      'Checks the restaurant status AND current time against its configured opening hours. ' +
      'Returns `true` only when status is OPEN and the current time falls within an active shift.',
  })
  @ApiParam({ name: 'id', description: 'Restaurant UUID' })
  @ApiResponse({ status: 200, schema: { example: { isOpen: true } } })
  async isOpen(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ isOpen: boolean }> {
    const isOpen = await this.restaurantService.isOpenNow(id);
    return { isOpen };
  }

  // ── PATCH /restaurants/:id ────────────────────────────────────────────────
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({
    summary: 'Update restaurant profile',
    description:
      'Updates restaurant fields. Requires restaurant ownership or a manager role ' +
      'with `canEditMenu` permission. If the name changes, the slug is re-generated.',
  })
  @ApiParam({ name: 'id', description: 'Restaurant UUID' })
  @ApiResponse({ status: 200, type: RestaurantResponseDto })
  @ApiResponse({ status: 403, description: 'Not the owner or insufficient permissions', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Restaurant not found', type: ErrorResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RestaurantResponseDto> {
    return this.restaurantService.update(id, dto, user.id);
  }

  // ── PATCH /restaurants/:id/availability ───────────────────────────────────
  @Patch(':id/availability')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canChangeAvailability')
  @ApiOperation({
    summary: 'Change restaurant availability status',
    description:
      '**Statuses:**\n' +
      '- `OPEN` — accepting orders normally\n' +
      '- `CLOSED` — not accepting orders\n' +
      '- `BUSY` — accepting orders but displaying extended wait time (`waitTimeMinutes`)\n' +
      '- `PAUSED` — temporarily paused; set `autoResumeAt` to auto-resume\n\n' +
      'Every change is logged to `restaurant_availability_log`.',
  })
  @ApiParam({ name: 'id', description: 'Restaurant UUID' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        status: 'PAUSED',
        message: 'Restaurant has paused new orders temporarily.',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions', type: ErrorResponseDto })
  async changeAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeAvailabilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.restaurantService.changeAvailability(id, dto, user.id);
  }

  // ── DELETE /restaurants/:id ───────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Soft-delete a restaurant (Admin only)',
    description: 'Sets `deletedAt` and `isActive = false`. Irreversible via API — use DB restore.',
  })
  @ApiParam({ name: 'id', description: 'Restaurant UUID' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 403, description: 'Admin role required', type: ErrorResponseDto })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MessageResponseDto> {
    await this.restaurantService.softDelete(id);
    return { message: 'Restaurant has been deactivated.' };
  }
}