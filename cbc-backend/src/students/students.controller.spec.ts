import { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('StudentsController route matching', () => {
  let app: INestApplication;
  let studentsService: {
    findByParent: jest.Mock;
    findOne: jest.Mock;
  };

  beforeAll(async () => {
    studentsService = {
      findByParent: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ _id: 'student-id' }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        {
          provide: StudentsService,
          useValue: studentsService,
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: (_context: ExecutionContext) => true,
          },
        },
        {
          provide: RolesGuard,
          useValue: {
            canActivate: (_context: ExecutionContext) => true,
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('routes /students/by-parent to the parent-specific handler', async () => {
    await request(app.getHttpServer()).get('/students/by-parent').expect(200);

    expect(studentsService.findByParent).toHaveBeenCalled();
    expect(studentsService.findOne).not.toHaveBeenCalled();
  });
});
