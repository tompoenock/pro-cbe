import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './entities/user.schema';
import { UserSession, UserSessionDocument } from './entities/user-session.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from './permission.service';
import { SchoolPermission } from './permissions.enum';
import { Role } from './roles.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserSession.name) private sessionModel: Model<UserSessionDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private permissionService: PermissionService,
  ) {}

  // ─── REGISTER ────────────────────────────────────────────────

  async register(registerDto: RegisterDto, ipAddress?: string) {
    const { username, email, phone_no, password } = registerDto;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await this.userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (!password) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new this.userModel({
      username,
      email: normalizedEmail,
      phone_no,
      password: hashedPassword,
      role: Role.User,
      isApproved: false,
    });

    await newUser.save();

    return {
      message: 'Registration successful! Your account is pending admin approval.',
      isAutoApproved: false,
    };
  }

  // ─── ADMIN REGISTER (pre-approved) ──────────────────────────

  async adminRegister(registerDto: RegisterDto, adminUser: any) {
    const { username, email, phone_no, role, organizationId, branchId, isApproved } = registerDto;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await this.userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const generatedPassword = this.generateRandomPassword(8);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const newUser = new this.userModel({
      username,
      email: normalizedEmail,
      phone_no,
      password: hashedPassword,
      role: role || Role.User,
      isApproved: typeof isApproved === 'boolean' ? isApproved : true,
      requirePasswordChange: true,
      temporaryPassword: generatedPassword,
      organizationId: organizationId ? new Types.ObjectId(organizationId) : adminUser.organizationId,
      branchId: branchId ? new Types.ObjectId(branchId) : adminUser.branchId,
    });

    await newUser.save();

    // Assign default teacher permissions when creating a teacher user
    const createdUserId = newUser._id.toString();
    if ((role || Role.User) === Role.Teacher) {
      const defaultTeacherPermissions = [
        SchoolPermission.VIEW_DASHBOARD,
        SchoolPermission.VIEW_SUBJECTS,
        SchoolPermission.VIEW_CLASSES,
        SchoolPermission.VIEW_PERFORMANCE,
        SchoolPermission.VIEW_GRADES,
        SchoolPermission.VIEW_REPORTS,
        SchoolPermission.GENERATE_REPORTS,
      ];
      await this.permissionService.upsertPermissions(createdUserId, defaultTeacherPermissions);
    }

    return {
      message: 'User created successfully. Temporary password: ' + generatedPassword,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      temporaryPassword: generatedPassword,
    };
  }

  // ─── LOGIN ───────────────────────────────────────────────────

  async login(loginDto: LoginDto, ipAddress?: string) {
    const { email, password } = loginDto;
    const normalizedEmail = email.toLowerCase();

    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isApproved) {
      throw new UnauthorizedException(
        'Your account is pending approval. You will receive a notification once an administrator approves your account.',
      );
    }

    const payload = {
      sub: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId?.toString(),
      branchId: user.branchId?.toString(),
    };
    const access_token = this.jwtService.sign(payload);

    // Create session record
    await this.startSession(user._id, ipAddress);

    return {
      access_token,
      requirePasswordChange: user.requirePasswordChange || false,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone_no: user.phone_no,
        organizationId: user.organizationId?.toString(),
        branchId: user.branchId?.toString(),
      },
    };
  }

  // ─── LOGOUT ──────────────────────────────────────────────────

  async logout(userId: string) {
    // Find the latest open session for the user
    const session = await this.sessionModel
      .findOne({ userId: new Types.ObjectId(userId), logoutAt: null } as any)
      .sort({ loginAt: -1 });

    if (session) {
      await this.endSession(session._id);
    }

    return { message: 'Logged out successfully' };
  }

  // ─── FORGOT PASSWORD ────────────────────────────────────────

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({
      email: forgotPasswordDto.email.toLowerCase(),
    });

    if (!user) {
      // Don't reveal whether email exists
      return { message: 'If your email is registered, you will receive a password reset link.' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user._id, email: user.email, type: 'reset' },
      { expiresIn: '15m' },
    );

    // In production, send email with reset link
    console.log(`Password reset token for ${user.email}: ${resetToken}`);

    return { message: 'If your email is registered, you will receive a password reset link.' };
  }

  // ─── RESET PASSWORD ─────────────────────────────────────────

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(resetPasswordDto.token);
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.type !== 'reset') {
      throw new BadRequestException('Invalid token type');
    }

    const user = await this.userModel.findById(payload.sub);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await user.save();

    return { message: 'Password has been reset successfully' };
  }

  // ─── UPDATE PASSWORD ────────────────────────────────────────

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(updatePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    await user.save();

    return { message: 'Password updated successfully' };
  }

  // ─── FIRST TIME PASSWORD CHANGE ─────────────────────────────

  async firstTimePasswordChange(userId: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.requirePasswordChange = false;
    user.temporaryPassword = undefined;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  // ─── APPROVE USER ───────────────────────────────────────────

  async approveUser(userId: string, organizationId?: string, branchId?: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isApproved = true;
    if (organizationId) {
      user.organizationId = new Types.ObjectId(organizationId) as any;
    }
    if (branchId) {
      user.branchId = new Types.ObjectId(branchId) as any;
    }
    await user.save();

    return { message: 'User approved successfully', user };
  }

  // ─── REJECT USER ────────────────────────────────────────────

  async rejectUser(userId: string) {
    const user = await this.userModel.findByIdAndDelete(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User rejected and removed' };
  }

  // ─── GET PROFILE ────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -temporaryPassword');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // ─── FIND ALL USERS ─────────────────────────────────────────

  async findAllUsers(organizationId?: string) {
    const filter: any = {};
    if (organizationId) {
      filter.organizationId = new Types.ObjectId(organizationId);
    }

    return this.userModel
      .find(filter)
      .select('-password -temporaryPassword')
      .sort({ createdAt: -1 });
  }

  async findTeachers(organizationId?: string) {
    const filter: any = { role: Role.Teacher };
    if (organizationId) filter.organizationId = new Types.ObjectId(organizationId);

    return this.userModel
      .find(filter)
      .select('-password -temporaryPassword')
      .sort({ username: 1 })
      .exec();
  }

  // ─── UPDATE USER ────────────────────────────────────────────

  async updateUser(userId: string, updateData: Partial<RegisterDto>) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateData.username) user.username = updateData.username;
    if (updateData.email) user.email = updateData.email.toLowerCase();
    if (updateData.phone_no) user.phone_no = updateData.phone_no;
    if (updateData.role) user.role = updateData.role;

    await user.save();
    return user;
  }

  // ─── DELETE USER ─────────────────────────────────────────────

  async deleteUser(userId: string) {
    const user = await this.userModel.findByIdAndDelete(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  // ─── ADMIN RESET USER PASSWORD ─────────────────────────────

  async adminResetPassword(adminResetPasswordDto: AdminResetPasswordDto) {
    const { userId, newPassword, confirmPassword } = adminResetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.requirePasswordChange = true;
    await user.save();

    return { message: 'User password has been reset successfully' };
  }

  // ─── SESSION HELPERS ─────────────────────────────────────────

  async getActiveUserIds(organizationId: string) {
    const sessions = await this.sessionModel.find({
      organizationId: new Types.ObjectId(organizationId),
      logoutAt: null,
    } as any);
    return sessions.map((s) => s.userId.toString());
  }

  // ─── UTILITY ─────────────────────────────────────────────────

  private generateRandomPassword(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async startSession(userId: any, ipAddress?: string): Promise<void> {
    await this.sessionModel.create({
      userId: userId instanceof Types.ObjectId ? userId : new Types.ObjectId(userId),
      ipAddress: ipAddress || 'unknown',
      loginAt: new Date(),
    } as any);
  }

  private async endSession(sessionId: any): Promise<void> {
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      logoutAt: new Date(),
    } as any);
  }
}
