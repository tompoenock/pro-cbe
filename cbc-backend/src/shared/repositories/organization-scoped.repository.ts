import { Document } from 'mongoose';
import { BaseRepository } from './base.repository';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';
import { PaginationOptions } from '../interfaces/pagination-options.interface';

export abstract class OrganizationScopedRepository<
  T extends Document & { organizationId: any },
> extends BaseRepository<T> {
  async findByOrganization(organizationId: string): Promise<T[]> {
    return this.model
      .find({
        organizationId,
        isDeleted: false,
      })
      .exec();
  }

  async findByOrganizationPaginated(
    organizationId: string,
    options: PaginationOptions<T> = {},
  ): Promise<PaginatedResponse<T>> {
    const filter = { ...options.filter, organizationId };
    return this.findPaginated({ ...options, filter });
  }

  async findOneByOrganization(
    organizationId: string,
    filter: any = {},
  ): Promise<T | null> {
    return this.model
      .findOne({
        organizationId,
        ...filter,
        isDeleted: false,
      })
      .exec();
  }

  async updateByOrganization(
    organizationId: string,
    id: string,
    data: Partial<T>,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, organizationId, isDeleted: false } as any,
        { ...data, updatedAt: new Date() },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
  }

  async deleteByOrganization(
    organizationId: string,
    id: string,
  ): Promise<boolean> {
    const result = await this.model
      .findOneAndUpdate(
        { _id: id, organizationId, isDeleted: false } as any,
        { isDeleted: true, updatedAt: new Date() },
      )
      .exec();
    return !!result;
  }
}
