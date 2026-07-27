import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Staff, StaffDocument } from './entities/staff.schema';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(@InjectModel(Staff.name) private staffModel: Model<StaffDocument>) {}

  async create(dto: CreateStaffDto): Promise<StaffDocument> {
    const existing = await this.staffModel.findOne({
      staffNumber: dto.staffNumber, isDeleted: false,
    } as any);
    if (existing) throw new ConflictException('Staff with this staff number already exists');
    return this.staffModel.create(dto as any);
  }

  async findAll(staffType?: string, search?: string): Promise<StaffDocument[]> {
    const filter: any = { isDeleted: false };
    if (staffType) filter.staffType = staffType;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { staffNumber: { $regex: search, $options: 'i' } },
      ];
    }
    return this.staffModel.find(filter).populate('userId', 'username email').sort({ lastName: 1, firstName: 1 }).exec();
  }

  async findOne(id: string): Promise<StaffDocument> {
    const doc = await this.staffModel.findById(id).populate('userId', 'username email').exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Staff not found');
    return doc;
  }

  async findTeachers(): Promise<StaffDocument[]> {
    return this.staffModel.find({
      staffType: 'teaching', isActive: true, isDeleted: false,
    } as any).sort({ lastName: 1, firstName: 1 }).exec();
  }

  async update(id: string, dto: UpdateStaffDto): Promise<StaffDocument> {
    const doc = await this.staffModel.findByIdAndUpdate(id, dto, { returnDocument: 'after' }).populate('userId', 'username email').exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Staff not found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const result = await this.staffModel.findByIdAndUpdate(id, { isDeleted: true }, { returnDocument: 'after' }).exec();
    if (!result) throw new NotFoundException('Staff not found');
  }

  async count(): Promise<number> {
    return this.staffModel.countDocuments({ isDeleted: false } as any).exec();
  }
}
