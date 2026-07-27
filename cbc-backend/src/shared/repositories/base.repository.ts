import { Document, Model } from 'mongoose';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';
import { PaginationOptions } from '../interfaces/pagination-options.interface';

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model({
      ...data,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return entity.save();
  }

  async findById(id: string): Promise<T | null> {
    return this.model
      .findById(id)
      .lean(true)
      .exec() as unknown as Promise<T | null>;
  }

  async findAll(): Promise<T[]> {
    return this.model.find({ isDeleted: false }).exec();
  }

  async findOne(filter: any): Promise<T | null> {
    return this.model.findOne({ ...filter, isDeleted: false }).exec();
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model
      .findByIdAndUpdate(id, {
        isDeleted: true,
        updatedAt: new Date(),
      })
      .exec();
    return !!result;
  }

  async findPaginated(
    options: PaginationOptions<T> = {},
  ): Promise<PaginatedResponse<T>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt' as keyof T,
      sortOrder = 'desc',
      filter = {},
    } = options;

    const skip = (page - 1) * limit;
    const baseFilter = { ...filter, isDeleted: false };

    const [total, data] = await Promise.all([
      this.model.countDocuments(baseFilter),
      this.model
        .find(baseFilter)
        .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
