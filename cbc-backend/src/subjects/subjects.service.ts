import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, SubjectDocument } from './entities/subject.schema';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { AssignSubjectDto } from './dto/assign-subject.dto';
import { Class, ClassDocument } from '../classes/entities/class.schema';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
  ) {}

  private readonly CBESubjectTemplates: Record<string, { name: string; code: string }[]> = {
    lowerPrimary: [
      { name: 'English', code: 'ENG' },
      { name: 'Kiswahili', code: 'KIS' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Environmental Activities', code: 'ENV' },
      { name: 'Creative Arts', code: 'ART' },
      { name: 'Religious Education', code: 'REL' },
      { name: 'Physical and Health Education', code: 'PHE' },
      { name: 'ICT', code: 'ICT' },
    ],
    upperPrimary: [
      { name: 'English', code: 'ENG' },
      { name: 'Kiswahili', code: 'KIS' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Science and Technology', code: 'SCI' },
      { name: 'Social Studies', code: 'SOC' },
      { name: 'Religious Education', code: 'REL' },
      { name: 'Creative Arts', code: 'ART' },
      { name: 'Physical and Health Education', code: 'PHE' },
      { name: 'ICT', code: 'ICT' },
      { name: 'Agriculture', code: 'AGR' },
    ],
    juniorSecondary: [
      { name: 'English', code: 'ENG' },
      { name: 'Kiswahili', code: 'KIS' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Integrated Science', code: 'SCI' },
      { name: 'Health Education', code: 'HEA' },
      { name: 'Pre-Technical Studies', code: 'PTS' },
      { name: 'Social Studies', code: 'SOC' },
      { name: 'Business Studies', code: 'BUS' },
      { name: 'Agriculture and Nutrition', code: 'AGR' },
      { name: 'Computer Science', code: 'CSC' },
      { name: 'Creative Arts', code: 'ART' },
      { name: 'Physical Education', code: 'PHE' },
      { name: 'Religious Education', code: 'REL' },
    ],
    secondary: [
      { name: 'English', code: 'ENG' },
      { name: 'Kiswahili', code: 'KIS' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Biology', code: 'BIO' },
      { name: 'Chemistry', code: 'CHE' },
      { name: 'Physics', code: 'PHY' },
      { name: 'Geography', code: 'GEO' },
      { name: 'History and Government', code: 'HIS' },
      { name: 'CRE', code: 'CRE' },
      { name: 'Business Studies', code: 'BUS' },
      { name: 'Computer Studies', code: 'CSC' },
      { name: 'Agriculture', code: 'AGR' },
      { name: 'Home Science', code: 'HSC' },
      { name: 'Art and Design', code: 'ART' },
      { name: 'Music', code: 'MUS' },
      { name: 'Physical Education', code: 'PHE' },
    ],
  };

  async create(dto: CreateSubjectDto): Promise<SubjectDocument> {
    const existing = await this.subjectModel.findOne({
      code: dto.code,
      classId: dto.classId || null,
      isDeleted: { $ne: true },
    } as any);
    if (existing) {
      throw new ConflictException('Subject already exists for this class');
    }
    return this.subjectModel.create(dto as any);
  }

  async findAll(classId?: string): Promise<SubjectDocument[]> {
    const filter: any = { isDeleted: false };
    if (classId) filter.classId = classId;

    // If classId is provided we still apply it above. For teacher-scoped access,
    // callers should pass an explicit filter via the controller. The SubjectsController
    // will enforce role-based filtering when needed.
    return this.subjectModel.find(filter)
      .populate('classId', 'name section')
      .populate('teacher', 'username email')
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Find subjects but restrict to a teacher's assigned subjects when a teacherId is provided.
   * If no teacherId provided, returns all subjects (used by admins).
   */
  async findAllForTeacher(teacherId?: string, classId?: string): Promise<SubjectDocument[]> {
    const filter: any = { isDeleted: false };
    if (classId) filter.classId = classId;
    if (teacherId) filter.teacher = teacherId;

    return this.subjectModel.find(filter)
      .populate('classId', 'name section')
      .populate('teacher', 'username email')
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<SubjectDocument> {
    const doc = await this.subjectModel.findById(id)
      .populate('classId', 'name section')
      .populate('teacher', 'username email')
      .exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Subject not found');
    return doc;
  }

  async update(id: string, dto: UpdateSubjectDto): Promise<SubjectDocument> {
    if (dto.code || dto.classId) {
      const current = await this.subjectModel.findById(id).exec();
      if (!current || current.isDeleted) throw new NotFoundException('Subject not found');

      const nextCode = dto.code ?? current.code;
      const nextClassId = dto.classId ?? current.classId?.toString() ?? null;

      const duplicate = await this.subjectModel.findOne({
        _id: { $ne: id },
        code: nextCode,
        classId: nextClassId,
        isDeleted: { $ne: true },
      } as any);

      if (duplicate) {
        throw new ConflictException('Subject already exists for this class');
      }
    }

    const doc = await this.subjectModel.findByIdAndUpdate(id, dto, { returnDocument: 'after' }).exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Subject not found');
    return doc;
  }

  async assign(id: string, dto: AssignSubjectDto): Promise<SubjectDocument> {
    const current = await this.subjectModel.findById(id).exec();
    if (!current || current.isDeleted) throw new NotFoundException('Subject not found');

    const nextCode = dto.code ?? current.code;
    const nextClassId = dto.classId ?? current.classId?.toString() ?? null;

    const duplicate = await this.subjectModel.findOne({
      _id: { $ne: id },
      code: nextCode,
      classId: nextClassId,
      isDeleted: { $ne: true },
    } as any);

    if (duplicate) {
      throw new ConflictException('Subject already exists for this class');
    }

    const update: any = {};
    if (dto.classId !== undefined) update.classId = dto.classId || null;
    if (dto.teacher !== undefined) update.teacher = dto.teacher || null;
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.code !== undefined) update.code = dto.code;

    const doc = await this.subjectModel.findByIdAndUpdate(id, update, { returnDocument: 'after' })
      .populate('classId', 'name section academicYear')
      .populate('teacher', 'username email')
      .exec();

    if (!doc || doc.isDeleted) throw new NotFoundException('Subject not found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const result = await this.subjectModel.findByIdAndUpdate(id, { isDeleted: true }, { returnDocument: 'after' }).exec();
    if (!result) throw new NotFoundException('Subject not found');
  }

  async count(): Promise<number> {
    return this.subjectModel.countDocuments({ isDeleted: false } as any).exec();
  }

  private async repairSubjectIndexes(): Promise<void> {
    try {
      await this.subjectModel.collection.dropIndex('organizationId_1_branchId_1_code_1');
    } catch (error: any) {
      const indexMissing =
        error?.codeName === 'IndexNotFound' ||
        error?.message?.includes('index not found') ||
        error?.message?.includes('index does not exist');

      if (!indexMissing) {
        throw error;
      }
    }

    await this.subjectModel.syncIndexes();
  }

  async seedCBESubjects(
    classId?: string,
    category?: string,
  ): Promise<{ classesProcessed: number; subjectsUpserted: number }> {
    await this.repairSubjectIndexes();

    const filter: any = { isDeleted: { $ne: true } };
    if (classId) {
      filter._id = classId;
    }

    const classesToSeed = await this.classModel.find(filter).sort({ name: 1 }).exec();

    if (classesToSeed.length === 0) {
      throw new NotFoundException('No classes found to seed subjects against');
    }

    let subjectsUpserted = 0;

    for (const classDoc of classesToSeed) {
      const subjectTemplate = category
        ? this.getTemplateForCategory(category)
        : this.getTemplateForClass(classDoc.name);

      for (const subject of subjectTemplate) {
        const result = await this.subjectModel.updateOne(
          { classId: classDoc._id, code: subject.code, isDeleted: { $ne: true } } as any,
          {
            $setOnInsert: {
              name: subject.name,
              code: subject.code,
              classId: classDoc._id,
              teacher: null,
              isActive: true,
              isDeleted: false,
            },
          },
          { upsert: true },
        );

        if (result.upsertedCount > 0) {
          subjectsUpserted += 1;
        }
      }
    }

    return { classesProcessed: classesToSeed.length, subjectsUpserted };
  }

  private getCategoryForClass(className: string): 'lowerPrimary' | 'upperPrimary' | 'juniorSecondary' | 'secondary' {
    const normalized = className.toLowerCase();

    if (normalized.startsWith('grade 1') || normalized.startsWith('grade 2') || normalized.startsWith('grade 3')) {
      return 'lowerPrimary';
    }

    if (normalized.startsWith('grade 4') || normalized.startsWith('grade 5') || normalized.startsWith('grade 6')) {
      return 'upperPrimary';
    }

    if (normalized.startsWith('grade 7') || normalized.startsWith('grade 8') || normalized.startsWith('grade 9')) {
      return 'juniorSecondary';
    }

    return 'secondary';
  }

  private getTemplateForCategory(category: string): { name: string; code: string }[] {
    return this.CBESubjectTemplates[category] ?? this.CBESubjectTemplates.secondary;
  }

  private getTemplateForClass(className: string): { name: string; code: string }[] {
    const normalized = className.toLowerCase();

    if (normalized.startsWith('grade 1') || normalized.startsWith('grade 2') || normalized.startsWith('grade 3')) {
      return this.CBESubjectTemplates.lowerPrimary;
    }

    if (normalized.startsWith('grade 4') || normalized.startsWith('grade 5') || normalized.startsWith('grade 6')) {
      return this.CBESubjectTemplates.upperPrimary;
    }

    if (normalized.startsWith('grade 7') || normalized.startsWith('grade 8') || normalized.startsWith('grade 9')) {
      return this.CBESubjectTemplates.juniorSecondary;
    }

    return this.CBESubjectTemplates.secondary;
  }
}
