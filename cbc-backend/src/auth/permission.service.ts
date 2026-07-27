import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Permission, PermissionDocument } from './entities/permission.schema';
import { SchoolPermission } from './permissions.enum';
import { Role } from './roles.enum';

@Injectable()
export class PermissionService {
  constructor(
    @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
  ) {}

  async getPermissionsByUserId(userId: string, role?: string): Promise<string[]> {
    // Super admin has all permissions
    if (role === Role.SuperAdmin) {
      return Object.values(SchoolPermission);
    }
    const doc = await this.permissionModel.findOne(({ userId: new Types.ObjectId(userId) } as any)).lean<Permission>();
    return doc?.permissions || [];
  }

  async upsertPermissions(userId: string, permissions: string[]): Promise<PermissionDocument> {
    const validPermissions = permissions.filter(p =>
      Object.values(SchoolPermission).includes(p as SchoolPermission),
    );

    const result = await this.permissionModel.findOneAndUpdate(
      ({ userId: new Types.ObjectId(userId) } as any),
      { permissions: validPermissions },
      { upsert: true, returnDocument: 'after' },
    );
    // result can be null if upserted, so fetch again if needed
    if (!result || (result as any).value === undefined) {
      return (await this.permissionModel.findOne(({ userId: new Types.ObjectId(userId) } as any))) as PermissionDocument;
    }
    // result may be a ModifyResult, so return result.value if present
    return ((result as any).value ?? result) as PermissionDocument;
  }

  async hasPermission(userId: string, permission: string, role?: string): Promise<boolean> {
    if (role === Role.SuperAdmin) return true;
    const doc = await this.permissionModel.findOne(({ userId: new Types.ObjectId(userId) } as any)).lean<Permission>();
    return doc?.permissions?.includes(permission) || false;
  }

  async hasAnyPermission(userId: string, permissions: string[], role?: string): Promise<boolean> {
    if (role === Role.SuperAdmin) return true;
    const doc = await this.permissionModel.findOne(({ userId: new Types.ObjectId(userId) } as any)).lean<Permission>();
    if (!doc) return false;
    return permissions.some(p => doc.permissions.includes(p));
  }

  async deletePermissions(userId: string): Promise<void> {
    await this.permissionModel.deleteOne(({ userId: new Types.ObjectId(userId) } as any));
  }

  getAllPermissions(): { key: string; value: string }[] {
    return Object.entries(SchoolPermission).map(([key, value]) => ({ key, value }));
  }
}
