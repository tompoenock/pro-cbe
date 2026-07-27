import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Leave, LeaveDocument } from './entities/leave.schema';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { ProcessLeaveDto } from './dto/process-leave.dto';

@Injectable()
export class LeaveService {
  constructor(@InjectModel(Leave.name) private leaveModel: Model<LeaveDocument>) {}

  async create(dto: CreateLeaveDto): Promise<LeaveDocument> {
    return this.leaveModel.create(dto as any);
  }

  async findAll(
    applicantType?: string,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<LeaveDocument[]> {
    const filter: any = { isDeleted: false };
    if (applicantType) filter.applicantType = applicantType;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.startDate = {};
      if (dateFrom) filter.startDate.$gte = new Date(dateFrom);
      if (dateTo) filter.startDate.$lte = new Date(dateTo);
    }
    return this.leaveModel
      .find(filter)
      .populate('approvedBy', 'username email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<LeaveDocument> {
    const doc = await this.leaveModel
      .findById(id)
      .populate('approvedBy', 'username email')
      .exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Leave application not found');
    return doc;
  }

  async update(id: string, dto: UpdateLeaveDto): Promise<LeaveDocument> {
    const doc = await this.leaveModel.findByIdAndUpdate(id, dto, { returnDocument: 'after' }).exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Leave application not found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const result = await this.leaveModel.findByIdAndUpdate(id, { isDeleted: true }, { returnDocument: 'after' }).exec();
    if (!result) throw new NotFoundException('Leave application not found');
  }

  async processLeave(id: string, dto: ProcessLeaveDto): Promise<LeaveDocument> {
    const doc = await this.leaveModel
      .findByIdAndUpdate(
        id,
        {
          status: dto.status,
          approvedBy: dto.approvedBy,
          approverComment: dto.approverComment,
        },
        { returnDocument: 'after' },
      )
      .populate('approvedBy', 'username email')
      .exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Leave application not found');
    return doc;
  }
}
