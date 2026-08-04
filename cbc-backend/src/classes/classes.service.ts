import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class, ClassDocument } from './entities/class.schema';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Subject, SubjectDocument } from '../subjects/entities/subject.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateClassDto): Promise<ClassDocument> {
    const existing = await this.classModel.findOne({
      name: dto.name,
      section: dto.section,
      academicYear: dto.academicYear,
      isDeleted: false,
    } as any);
    if (existing) {
      throw new ConflictException('Class with this name, section, and academic year already exists');
    }
    const created = await this.classModel.create(dto as any);
    if (dto.classTeacher) {
      await this.notifyClassTeacher(created, dto.classTeacher);
    }
    return created;
  }

  async findAll(academicYear?: string): Promise<ClassDocument[]> {
    const filter: any = { isDeleted: false };
    if (academicYear) filter.academicYear = academicYear;
    return this.classModel
      .find(filter)
      .populate('teacher', 'username email')
      .populate('classTeacher', 'username email firstName lastName')
      .sort({ name: 1 })
      .exec();
  }

  async findAllForClassTeacher(classTeacherId: string, academicYear?: string): Promise<ClassDocument[]> {
    const filter: any = { isDeleted: false, classTeacher: classTeacherId };
    if (academicYear) filter.academicYear = academicYear;
    return this.classModel
      .find(filter)
      .populate('teacher', 'username email')
      .populate('classTeacher', 'username email firstName lastName')
      .sort({ name: 1 })
      .exec();
  }

  async findAllForTeacher(teacherId: string, academicYear?: string): Promise<ClassDocument[]> {
    const filter: any = { isDeleted: false };
    if (academicYear) filter.academicYear = academicYear;

    // Find classes where the class teacher is the teacherId OR where the teacher
    // is assigned to any subject that belongs to the class. This ensures teachers
    // who are assigned per-subject still see their classes in the UI.
    if (teacherId) {
      const subjectClassIds: any[] = await this.subjectModel
        .find({ teacher: teacherId as any, isDeleted: false } as any)
        .distinct('classId')
        .exec();

      filter.$or = [
        { teacher: teacherId },
        { classTeacher: teacherId },
        { _id: { $in: subjectClassIds } },
      ];
    }

    return this.classModel
      .find(filter)
      .populate('teacher', 'username email')
      .populate('classTeacher', 'username email firstName lastName')
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<ClassDocument> {
    const doc = await this.classModel
      .findById(id)
      .populate('teacher', 'username email')
      .populate('classTeacher', 'username email firstName lastName')
      .exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Class not found');
    return doc;
  }

  async update(id: string, dto: UpdateClassDto): Promise<ClassDocument> {
    const previous = await this.classModel.findById(id).exec();
    if (!previous || previous.isDeleted) throw new NotFoundException('Class not found');

    const doc = await this.classModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .populate('teacher', 'username email')
      .populate('classTeacher', 'username email firstName lastName')
      .exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Class not found');

    if (dto.classTeacher && previous.classTeacher?.toString() !== dto.classTeacher) {
      await this.notifyClassTeacher(doc, dto.classTeacher);
    }
    return doc;
  }

  async assignClassTeacher(id: string, classTeacherId: string): Promise<ClassDocument> {
    const doc = await this.classModel
      .findByIdAndUpdate(
        id,
        { classTeacher: new Types.ObjectId(classTeacherId) },
        { returnDocument: 'after' },
      )
      .populate('teacher', 'username email')
      .populate('classTeacher', 'username email firstName lastName')
      .exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Class not found');
    await this.notifyClassTeacher(doc, classTeacherId);
    return doc;
  }

  async remove(id: string): Promise<void> {
    const result = await this.classModel.findByIdAndUpdate(id, { isDeleted: true }, { returnDocument: 'after' }).exec();
    if (!result) throw new NotFoundException('Class not found');
  }

  async count(): Promise<number> {
    return this.classModel.countDocuments({ isDeleted: false } as any).exec();
  }

  private async notifyClassTeacher(classDoc: ClassDocument, classTeacherId: string): Promise<void> {
    try {
      const label = `${classDoc.name}${classDoc.section ? ' - ' + classDoc.section : ''} (${classDoc.academicYear})`;
      await this.notificationsService.create({
        recipientId: classTeacherId,
        title: 'Assigned as Class Teacher',
        message: `You have been assigned as the class teacher for ${label}. You will receive performance submissions to review and approve.`,
        type: 'class_teacher_assignment',
        classId: classDoc._id.toString(),
      });
    } catch (err) {
      // Notification failures should not break class assignment
      console.error('Failed to notify class teacher', err?.message || err);
    }
  }
}
