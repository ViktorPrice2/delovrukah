import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { resolveJwtSecret } from './jwt-secret.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<{ access_token: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        ...(dto.role === Role.CUSTOMER
          ? {
              customerProfile: {
                create: {
                  fullName: dto.fullName ?? dto.email,
                },
              },
            }
          : {
              providerProfile: {
                create: {
                  displayName: dto.displayName ?? dto.email,
                },
              },
            }),
      },
    });

    return this.signToken(user.id, user.email, user.role);
  }

  async signin(dto: SigninDto): Promise<{ access_token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id, user.email, user.role);
  }

  private async signToken(
    userId: string,
    email: string,
    role: Role,
  ): Promise<{ access_token: string }> {
    const payload = { sub: userId, email, role };
    const secret = resolveJwtSecret(this.configService);
    const accessToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '1h',
    });

    return { access_token: accessToken };
  }
}
