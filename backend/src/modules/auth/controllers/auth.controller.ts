import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    const { name, email, password, role } = body;
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userRepo.save(this.userRepo.create({ name, email, passwordHash, role }));
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { token: this.jwtService.sign(payload), user: { id: user.id, name, email, role } };
  }

  @Post('login')
  async login(@Body() body: any) {
    const { email, password } = body;
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return { token: this.jwtService.sign(payload), user: { id: user.id, name: user.name, email, role: user.role } };
  }
}
