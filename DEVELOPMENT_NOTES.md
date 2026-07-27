# Development Notes - CBE Pathway Implementation

## Quick Start for Remaining Work

### Project Context
You're working on the CBE Pathway Finding and Corrector System - a comprehensive web-based platform for helping Kenyan students select appropriate CBE pathways based on their academic performance, interests, and abilities.

### Current State
- **Backend**: NestJS with MongoDB, ~12 core modules implemented
- **Frontend**: Angular, synced with backend modules
- **Status**: 60% complete, 40% remaining

### What's Missing
1. **Pathways Module** - Core feature for pathway recommendations and selection
2. **Reports Module** - Report generation and analytics
3. **Parent Portal** - Parent access features

---

## Module Development Patterns (Copy These!)

The existing modules follow consistent patterns. Use them as templates:

### Pattern 1: Standard Module Structure

All modules follow this structure (e.g., `students`, `staff`, `classes`):

```
module-name/
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.module.ts
├── dto/
│   ├── create-module.dto.ts
│   ├── update-module.dto.ts
│   └── module-query.dto.ts
├── entities/
│   └── module.entity.ts
└── schemas/
    └── module.schema.ts
```

### Pattern 2: Standard Controller Methods

```typescript
@Controller('api/resource')
export class ResourceController {
  constructor(private service: ResourceService) {}

  @Post('/')
  create(@Body() dto: CreateResourceDto) {
    return this.service.create(dto);
  }

  @Get('/')
  findAll(@Query() query: ResourceQueryDto) {
    return this.service.findAll(query);
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch('/:id')
  update(@Param('id') id: string, @Body() dto: UpdateResourceDto) {
    return this.service.update(id, dto);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
```

### Pattern 3: Standard Service Methods

```typescript
@Injectable()
export class ResourceService {
  constructor(
    @InjectModel(Resource.name)
    private resourceModel: Model<Resource>,
  ) {}

  async create(dto: CreateResourceDto) {
    const resource = new this.resourceModel(dto);
    return resource.save();
  }

  async findAll(query: ResourceQueryDto) {
    let queryBuilder = this.resourceModel.find();

    if (query.search) {
      queryBuilder = queryBuilder.where('name').regex(query.search);
    }

    const limit = query.limit || 50;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    return queryBuilder.skip(skip).limit(limit).exec();
  }

  async findById(id: string) {
    return this.resourceModel.findById(id).exec();
  }

  async update(id: string, dto: UpdateResourceDto) {
    return this.resourceModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  async delete(id: string) {
    return this.resourceModel.findByIdAndDelete(id).exec();
  }
}
```

---

## Key Implementation Details

### 1. Working with Student Performance Data

```typescript
// Access student grades
const performance = await this.performanceService.getStudentPerformance(studentId);

// Structure: { subjectId: score }
const subjectScores = performance.subjectScores; // { '507f1f77bcf86cd799439011': 85 }

// Calculate POINTSS
const POINTSS = Object.values(subjectScores).reduce((a, b) => a + b, 0) / scores.length / 100 * 4;
```

### 2. Reference Other Entities

```typescript
// Use ObjectId for relationships
const studentId = new ObjectId(studentIdString);

// Use populate() to fetch related data
const student = await this.studentModel
  .findById(studentId)
  .populate('classId', ['name', 'form'])
  .populate('subjects', ['name', 'code'])
  .exec();
```

### 3. Query Building Pattern

```typescript
// Always support pagination
const query = queryBuilder
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ createdAt: -1 });

// Add filters as needed
if (status) query = query.where('status').equals(status);
if (search) query = query.regex('name', search);
```

### 4. Error Handling

```typescript
// Use HTTP exceptions
if (!resource) {
  throw new NotFoundException('Resource not found');
}

// Validate authorization
if (resource.ownerId !== userId) {
  throw new ForbiddenException('Unauthorized');
}

// Handle duplicates
if (existingResource) {
  throw new ConflictException('Resource already exists');
}
```

---

## Frontend Components Pattern

### Component Structure
```typescript
// component.component.ts
@Component({
  selector: 'app-resource',
  templateUrl: './resource.component.html',
  styleUrls: ['./resource.component.scss'],
})
export class ResourceComponent implements OnInit {
  resources: Resource[] = [];
  loading = false;
  error: string | null = null;

  constructor(private service: ResourceService) {}

  ngOnInit() {
    this.loadResources();
  }

  loadResources() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.resources = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      },
    });
  }
}
```

---

## Common Issues & Solutions

### Issue: "ValidationPipe whitelisting extra properties"
**Solution**: Only send fields defined in DTO, don't spread entire objects
```typescript
// ❌ WRONG
const payload = { ...apiResponse };

// ✅ CORRECT
const payload = {
  name: apiResponse.name,
  description: apiResponse.description,
  // Only fields in DTO
};
```

### Issue: "limit must not be greater than 100"
**Solution**: Always use Math.min() and pass explicit limit parameter
```typescript
const limit = Math.min(queryLimit || 100, 100);
```

### Issue: "Cannot populate field that doesn't exist"
**Solution**: Check field is ObjectId reference before populating
```typescript
.populate('pathwayId') // This field must exist in schema as ObjectId
```

---

## Database Schema Conventions

### Always Include These Fields
```typescript
createdAt: {
  type: Date,
  default: Date.now,
},
updatedAt: {
  type: Date,
  default: Date.now,
}
```

### Use This Pattern for Enums
```typescript
status: {
  type: String,
  enum: ['active', 'inactive', 'pending'],
  default: 'active',
}
```

### For Foreign Keys (References)
```typescript
studentId: {
  type: Schema.Types.ObjectId,
  ref: 'Student',
  required: true,
}
```

### For Arrays of References
```typescript
subjects: [{
  type: Schema.Types.ObjectId,
  ref: 'Subject',
}]
```

---

## Testing Patterns

### Basic Service Test
```typescript
describe('ResourceService', () => {
  let service: ResourceService;
  let model: Model<Resource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceService,
        {
          provide: getModelToken(Resource.name),
          useValue: {
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ResourceService>(ResourceService);
    model = module.get(getModelToken(Resource.name));
  });

  it('should find resource by id', async () => {
    const resourceId = '507f1f77bcf86cd799439011';
    const expected = { _id: resourceId, name: 'Test' };

    jest.spyOn(model, 'findById').mockReturnValue({
      exec: jest.fn().mockResolvedValue(expected),
    } as any);

    const result = await service.findById(resourceId);
    expect(result).toEqual(expected);
  });
});
```

---

## Useful Commands

```bash
# Development
pnpm dev                           # Run both backend and frontend
pnpm backend:dev                   # Backend only
pnpm frontend:start                # Frontend only

# Testing
pnpm test                          # Run all tests
pnpm test:watch                    # Watch mode
pnpm test:cov                      # Coverage report

# Linting
pnpm lint                          # Check all files
pnpm format                        # Format all files

# Build
pnpm build                         # Build all packages
pnpm backend:build                 # Build backend only
pnpm frontend:build                # Build frontend only

# Database
# MongoDB must be running locally or use MongoDB Atlas connection string
```

---

## File Naming Conventions

- **Controllers**: `module.controller.ts`
- **Services**: `module.service.ts`
- **Modules**: `module.module.ts`
- **DTOs**: `create-module.dto.ts`, `update-module.dto.ts`
- **Entities**: `module.entity.ts`
- **Schemas**: `module.schema.ts`
- **Tests**: `*.spec.ts`
- **Angular Components**: `module.component.ts`, `module.component.html`
- **Angular Services**: `module.service.ts`

---

## Authorization Patterns

### Role-Based Access Control
```typescript
// Use decorators
@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles(Role.TEACHER, Role.ADMIN)
@Post('/:studentId')
async update(@Param('studentId') studentId: string) {
  // Only teachers and admins can access
}
```

### Available Roles
```typescript
export enum Role {
  ADMIN = 'admin',
  TEACHER = 'teacher', 
  STUDENT = 'student',
  PARENT = 'parent',  // Add this for parent portal
}
```

---

## Module Registration Checklist

When creating a new module, remember to:
- [ ] Add module to `CBE-backend/src/app.module.ts`
- [ ] Create all DTOs with validation decorators
- [ ] Add Mongoose schema and model
- [ ] Implement service with repository methods
- [ ] Create controller with proper routes
- [ ] Add routes to frontend app.routes.ts
- [ ] Create frontend service
- [ ] Create frontend component
- [ ] Write tests
- [ ] Update documentation

---

## Debugging Tips

### Check MongoDB Connection
```bash
# In terminal
mongo  # or mongosh for newer versions
use CBE-pathway
db.students.find().limit(1)
```

### Check Backend Logs
Backend logs appear in terminal where `pnpm backend:dev` runs. Look for:
- `[NestFactory]` - Module initialization
- `[InstanceLoader]` - Dependency injection
- `[RoutesResolver]` - Route registration

### Check Frontend Errors
Open browser DevTools (F12) in Chrome/Edge and check:
- Console tab for JavaScript errors
- Network tab for API calls
- Application tab for localStorage/auth tokens

### Mock API for Frontend Development
If backend isn't ready, use Angular HttpClientTestingModule in tests or create mock services.

---

## Important Notes

1. **Always use pagination** - Cap limit at 100 for performance
2. **Validate DTOs** - Use class-validator decorators
3. **Handle errors gracefully** - Use appropriate HTTP status codes
4. **Test your code** - Aim for 80%+ coverage
5. **Keep modules independent** - Minimize inter-module dependencies
6. **Use consistent naming** - Follow existing patterns
7. **Document complex logic** - Add comments for non-obvious implementations

---

## Resources

- **NestJS Docs**: https://docs.nestjs.com
- **Angular Docs**: https://angular.io/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **Mongoose Docs**: https://mongoosejs.com
- **JWT Auth**: https://jwt.io

---

**Last Updated**: May 2026
**For**: CBE Pathway Development Team
