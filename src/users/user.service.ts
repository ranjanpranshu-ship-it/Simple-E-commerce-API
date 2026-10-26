import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async CreateUser(email: string, password?: string) {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async GetUserByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async ValidateUser(email: string, password: string) {
    const user = await this.GetUserByEmail(email);

    if (user?.password && (await bcrypt.compare(password, user.password))) {
      return {
        id: user.id,
        email: user.email,
        roles: user.roles,
        tokenVersion: user.tokenVersion,
      };
    }
    return null;
  }

  async findOne(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async hasPassword(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, password: true },
    });
    return !!user?.password;
  }

  async setRoles(userId: number, roles: string[]) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.roles = roles;
    return this.userRepository.save(user);
  }

  /** Strip sensitive fields before returning a user to the client. */
  toSafeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      tokenVersion: user.tokenVersion,
      verified: user.verified,
    };
  }
}
