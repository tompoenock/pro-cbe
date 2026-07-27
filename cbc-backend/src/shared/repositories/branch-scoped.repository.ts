import { Document } from 'mongoose';
import { OrganizationScopedRepository } from './organization-scoped.repository';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';
import { PaginationOptions } from '../interfaces/pagination-options.interface';

export abstract class BranchScopedRepository<
  T extends Document & { organizationId: any; branchId: any },
> extends OrganizationScopedRepository<T> {
  async findByBranch(
    organizationId: string,
    branchId: string,
  ): Promise<T[]> {
    return this.model
      .find({
        organizationId,
        branchId,
        isDeleted: false,
      })
      .exec();
  }

  async findByBranchPaginated(
    organizationId: string,
    branchId: string,
    options: PaginationOptions<T> = {},
  ): Promise<PaginatedResponse<T>> {
    const filter = { ...options.filter, organizationId, branchId };
    return this.findPaginated({ ...options, filter });
  }

  async findOneByBranch(
    organizationId: string,
    branchId: string,
    filter: any = {},
  ): Promise<T | null> {
    return this.model
      .findOne({
        organizationId,
        branchId,
        ...filter,
        isDeleted: false,
      })
      .exec();
  }

  async updateByBranch(
    organizationId: string,
    branchId: string,
    id: string,
    data: Partial<T>,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, organizationId, branchId, isDeleted: false } as any,
        { ...data, updatedAt: new Date() },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
  }

  async deleteByBranch(
    organizationId: string,
    branchId: string,
    id: string,
  ): Promise<boolean> {
    const result = await this.model
      .findOneAndUpdate(
        { _id: id, organizationId, branchId, isDeleted: false } as any,
        { isDeleted: true, updatedAt: new Date() },
      )
      .exec();
    return !!result;
  }
}
