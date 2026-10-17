import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const count = await this.userRepository.count();
      if (count === 0) {
        this.logger.log('Seeding initial admin user in PostgreSQL...');
        const adminUser = this.userRepository.create({
          email: 'admin@example.com',
          name: 'DevOps Admin',
          role: 'admin',
        });
        await this.userRepository.save(adminUser);
        this.logger.log('Admin user seeded successfully');
      }
    } catch (err: any) {
      this.logger.warn(`Could not seed initial admin user: ${err.message}`);
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found in PostgreSQL`);
    }
    return user;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { deleted: true };
  }
}
