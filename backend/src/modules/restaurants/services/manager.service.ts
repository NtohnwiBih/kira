import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 }      from '@nestjs/event-emitter';
import * as crypto            from 'crypto';
import {
  InviteManagerDto, UpdateManagerRoleDto, SuspendManagerDto,
} from '../dto/restaurant.dto';
import {
  ManagerNotFoundException, ManagerAlreadyExistsException,
  ManagerLimitExceededException, CannotSelfSuspendException,
  RestaurantNotFoundException,
} from '../exceptions/restaurant.exceptions';
import {
  ManagerInvitedEvent, ManagerSuspendedEvent,
} from '../events/restaurant.events';
import { DEFAULT_PERMISSIONS } from '../interfaces/restaurant.interfaces';
import { RESTAURANT_CONSTANTS } from '../constants/restaurant.contant';
import { RestaurantManagerRole } from 'generated/prisma/client';
import { ManagerRepository, RestaurantRepository } from '../repositories';
 
@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);
 
  constructor(
    private readonly managerRepo:     ManagerRepository,
    private readonly restaurantRepo:  RestaurantRepository,
    private readonly emitter:         EventEmitter2,
  ) {}
 
  async invite(
    restaurantId: string,
    dto:          InviteManagerDto,
    invitedById:  string,
  ) {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) throw new RestaurantNotFoundException(restaurantId);
 
    const count = await this.managerRepo.countByRestaurant(restaurantId);
    if (count >= RESTAURANT_CONSTANTS.MAX_MANAGERS_PER_RESTAURANT) {
      throw new ManagerLimitExceededException(RESTAURANT_CONSTANTS.MAX_MANAGERS_PER_RESTAURANT);
    }
 
    // Check if this email already has a pending or active manager record
    const existing = await this.managerRepo.findByRestaurantAndUser(restaurantId, dto.email);
    if (existing) throw new ManagerAlreadyExistsException(dto.email);
 
    const inviteToken  = crypto.randomBytes(32).toString('hex');
    const inviteExpiry = new Date(
      Date.now() + RESTAURANT_CONSTANTS.INVITE_TOKEN_EXPIRES_HOURS * 60 * 60 * 1000,
    );
 
    const defaultPerms = DEFAULT_PERMISSIONS[dto.role as RestaurantManagerRole];
    const permissions  = { ...defaultPerms, ...dto.customPermissions };
 
    const manager = await this.managerRepo.create({
      restaurant:   { connect: { id: restaurantId } },
      userId:       '', // filled when user accepts invite
      inviteEmail:  dto.email,
      inviteToken,
      inviteExpiry,
      role:         dto.role as never,
      permissions,
      createdById:  invitedById,
      isActive:     false, // not active until accepted
    } as never);
 
    this.emitter.emit(
      ManagerInvitedEvent.EVENT,
      new ManagerInvitedEvent(
        restaurantId, restaurant.name, dto.email, dto.role,
        inviteToken, invitedById,
      ),
    );
 
    this.logger.log(
      `Manager invited to ${restaurantId} email=${dto.email} role=${dto.role}`,
    );
 
    return { message: `Invitation sent to ${dto.email}.`, managerId: manager.id };
  }
 
  async getManagers(restaurantId: string) {
    return this.managerRepo.findAllByRestaurant(restaurantId);
  }
 
  async updateRole(
    managerId:    string,
    restaurantId: string,
    dto:          UpdateManagerRoleDto,
  ) {
    const manager = await this.managerRepo.findById(managerId);
    if (!manager || manager.restaurantId !== restaurantId) {
      throw new ManagerNotFoundException();
    }
 
    const permissions = DEFAULT_PERMISSIONS[dto.role as RestaurantManagerRole];
    return this.managerRepo.update(managerId, {
      role: dto.role as never,
      permissions,
    });
  }
 
  async suspend(
    managerId:    string,
    restaurantId: string,
    dto:          SuspendManagerDto,
    suspendedById: string,
  ) {
    if (managerId === suspendedById) throw new CannotSelfSuspendException();
 
    const manager = await this.managerRepo.findById(managerId);
    if (!manager || manager.restaurantId !== restaurantId) {
      throw new ManagerNotFoundException();
    }
 
    const updated = await this.managerRepo.update(managerId, {
      isSuspended:  true,
      suspendedAt:  new Date(),
      suspendedById,
    });
 
    this.emitter.emit(
      ManagerSuspendedEvent.EVENT,
      new ManagerSuspendedEvent(restaurantId, managerId, suspendedById, dto.reason),
    );
 
    return updated;
  }
 
  async reinstate(managerId: string, restaurantId: string) {
    const manager = await this.managerRepo.findById(managerId);
    if (!manager || manager.restaurantId !== restaurantId) {
      throw new ManagerNotFoundException();
    }
    return this.managerRepo.update(managerId, {
      isSuspended:  false,
      suspendedAt:  null,
      suspendedById: null,
    });
  }
 
  async revoke(managerId: string, restaurantId: string) {
    const manager = await this.managerRepo.findById(managerId);
    if (!manager || manager.restaurantId !== restaurantId) {
      throw new ManagerNotFoundException();
    }
    await this.managerRepo.softDelete(managerId);
    return { message: 'Manager access revoked.' };
  }
}