import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateInterestDto } from './dto/create-interest.dto';
import { UpdateInterestDto } from './dto/update-interest.dto';
import { InterestCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InterestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInterestDto) {
    try {
      return await this.prisma.interest.create({
        data: {
          name: dto.name.trim(),
          category: dto.category ?? InterestCategory.OTHER,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Interest with this name already exists');
      }
      throw error;
    }
  }

  async findAll(category?: InterestCategory) {
    return this.prisma.interest.findMany({
      where: category ? { category } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const interest = await this.prisma.interest.findUnique({
      where: { id },
    });

    if (!interest) {
      throw new NotFoundException('Interest not found');
    }

    return interest;
  }

  async update(id: string, dto: UpdateInterestDto) {
    await this.findOne(id);

    try {
      return await this.prisma.interest.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          category: dto.category,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Interest with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.interest.delete({
      where: { id },
    });
  }
}
