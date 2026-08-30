import { SetMetadata } from '@nestjs/common';

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  BDM = 'BDM',
  JR_BDM = 'JR_BDM',
  SYSTEM = 'SYSTEM',
  READ_ONLY = 'READ_ONLY',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
