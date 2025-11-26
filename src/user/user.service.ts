// src/user/user.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { User } from "./entities/user.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  // Create an admin user. Expect { email, password } (additional fields ignored)
  async create(user: { email: string; password: string }) {
    if (!user?.email || !user?.password) {
      throw new BadRequestException("Email and password required");
    }

    // check uniqueness
    const exists = await this.userRepo.findOne({ where: { email: user.email } });
    if (exists) throw new BadRequestException("Email already exists");

    const created = this.userRepo.create({
      email: user.email,
      password: user.password // hashed by entity BeforeInsert hook
    });
    await this.userRepo.save(created);

    // return sanitized object
    return this.userObject(created);
  }

  // Find user by email
  async findOneByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    const u = await this.userRepo.findOne({ where: { email } });
    return u ?? null;
  }

  // Validate credentials - returns a sanitized user object (without password) on success
  async validateUser(email: string, plainPassword: string) {
    const user = await this.findOneByEmail(email);
    if (!user) return null;

    const valid = await bcrypt.compare(plainPassword, user.password);
    if (!valid) return null;

    return this.userObject(user);
  }

  // Login: accepts a user object or email and password pair
  // If passing credentials, call validateUser first
  async login(credentials: { email?: string; password?: string } | User) {
    let payloadUser: ReturnType<UserService["userObject"]> | null = null;

    const {email, password} = credentials as {email?:string; password?:string};
    if (email && password ) {
      // credentials provided
      payloadUser = await this.validateUser(email, password);
      if (!payloadUser) throw new UnauthorizedException("invalid credentials");
    } else if ((credentials as any)?.id) {
      // a User entity was passed
      payloadUser = this.userObject(credentials as User);
    } else {
      throw new BadRequestException("invalid login payload");
    }

    const payload = { sub: (payloadUser as any).id, email: (payloadUser as any).email };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token , user: payloadUser };
  }

  // Utility: shape user object returned to clients (exclude password)
  userObject(user: User) {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt
    };
  }
}