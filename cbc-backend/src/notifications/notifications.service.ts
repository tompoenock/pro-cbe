import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './entities/notification.schema';

export interface CreateNotificationInput {
  recipientId: string;
  title: string;
  message: string;
  type?: string;
  performanceId?: string;
  classId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(input: CreateNotificationInput): Promise<NotificationDocument> {
    return this.notificationModel.create({
      recipientId: input.recipientId,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      performanceId: input.performanceId ? new Types.ObjectId(input.performanceId) : undefined,
      classId: input.classId ? new Types.ObjectId(input.classId) : undefined,
    } as any);
  }

  async createMany(inputs: CreateNotificationInput[]): Promise<number> {
    if (!inputs.length) return 0;
    const docs = inputs.map((input) => ({
      recipientId: input.recipientId,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      performanceId: input.performanceId ? new Types.ObjectId(input.performanceId) : undefined,
      classId: input.classId ? new Types.ObjectId(input.classId) : undefined,
    }));
    const result = await this.notificationModel.insertMany(docs as any);
    return result.length;
  }

  async findAllForUser(userId: string, limit = 30): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ recipientId: new Types.ObjectId(userId) } as any)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ recipientId: new Types.ObjectId(userId), read: false } as any)
      .exec();
  }

  async markRead(userId: string, notificationId: string): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findOneAndUpdate(
        { _id: notificationId, recipientId: new Types.ObjectId(userId) } as any,
        { read: true },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.notificationModel
      .updateMany({ recipientId: new Types.ObjectId(userId), read: false } as any, { read: true })
      .exec();
    return result.modifiedCount;
  }
}
