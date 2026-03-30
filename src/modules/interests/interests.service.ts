import {
  BadRequestException,
  ConflictException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { CreateInterestDto } from './dto/create-interests.dto';
import { GetInterestsQueryDto } from './dto/get-interests.query.dto';
import { PaginatedInterestsDto } from './dto/paginated-interests.dto';
import { UpdateInterestDto } from './dto/update-interests.dto';
import { InterestCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

type InterestImportPayload = Partial<Record<InterestCategory, unknown>>;
type ImportedInterest = {
  name: string;
  category: InterestCategory;
};

export type ImportInterestsResult = {
  status: 'imported' | 'skipped';
  message: string;
  existingCount: number;
  insertedCount: number;
  totalInFile: number;
  categoryBreakdown: Record<InterestCategory, number>;
};

const ALL_INTEREST_CATEGORIES = Object.values(InterestCategory) as InterestCategory[];

@Injectable()
export class InterestsService {
  private readonly logger = new Logger(InterestsService.name);

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

  async findAll(query: GetInterestsQueryDto): Promise<PaginatedInterestsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const normalizedSearch = query.search?.trim();

    const where: Prisma.InterestWhereInput = {
      ...(query.category ? { category: query.category } : {}),
      ...(normalizedSearch
        ? {
            name: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    try {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.interest.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: limit,
        }),
        this.prisma.interest.count({ where }),
      ]);

      return {
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.warn(
        `Interests findAll failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2024') {
          throw new GatewayTimeoutException('Database query timed out');
        }

        throw new ServiceUnavailableException('Failed to fetch interests from database');
      }

      if (
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientRustPanicError
      ) {
        throw new ServiceUnavailableException('Database is unavailable');
      }

      throw error;
    }
  }

  async importFromJsonFile(file: Express.Multer.File | undefined): Promise<ImportInterestsResult> {
    if (!file) {
      throw new BadRequestException('JSON file is required');
    }

    const existingCount = await this.prisma.interest.count();

    if (existingCount > 0) {
      return {
        status: 'skipped',
        message: 'Interest table is not empty. Import skipped.',
        existingCount,
        insertedCount: 0,
        totalInFile: 0,
        categoryBreakdown: this.createEmptyCategoryBreakdown(),
      };
    }

    const payload = this.parseJsonFile(file);
    const interests = this.normalizeImportPayload(payload);

    if (interests.length === 0) {
      throw new BadRequestException('JSON file does not contain interests');
    }

    const result = await this.prisma.interest.createMany({
      data: interests,
      skipDuplicates: true,
    });

    return {
      status: 'imported',
      message: 'Interests imported successfully',
      existingCount,
      insertedCount: result.count,
      totalInFile: interests.length,
      categoryBreakdown: this.calculateCategoryBreakdown(interests),
    };
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

  private parseJsonFile(file: Express.Multer.File): unknown {
    const raw = file.buffer?.toString('utf-8').trim();

    if (!raw) {
      throw new BadRequestException('JSON file is empty');
    }

    try {
      return JSON.parse(raw);
    } catch {
      throw new BadRequestException('Invalid JSON file');
    }
  }

  private normalizeImportPayload(payload: unknown): ImportedInterest[] {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException(
        'Invalid import format. Expected object: { "ENTERTAINMENT": ["Movies"], ... }',
      );
    }

    const mappedPayload = payload as InterestImportPayload;
    const unknownCategories = Object.keys(mappedPayload).filter(
      (category) => !ALL_INTEREST_CATEGORIES.includes(category as InterestCategory),
    );

    if (unknownCategories.length > 0) {
      throw new BadRequestException(`Unknown categories in JSON: ${unknownCategories.join(', ')}`);
    }

    const interests: ImportedInterest[] = [];

    for (const category of ALL_INTEREST_CATEGORIES) {
      const categoryItems = mappedPayload[category];

      if (categoryItems === undefined) {
        continue;
      }

      if (!Array.isArray(categoryItems)) {
        throw new BadRequestException(`Category "${category}" must be an array of strings`);
      }

      categoryItems.forEach((item, index) => {
        if (typeof item !== 'string') {
          throw new BadRequestException(
            `Invalid value at "${category}[${index}]". Expected string`,
          );
        }

        const name = item.trim();

        if (!name) {
          throw new BadRequestException(`Empty interest name at "${category}[${index}]"`);
        }

        interests.push({
          name,
          category,
        });
      });
    }

    this.ensureUniqueInterestNames(interests);

    return interests;
  }

  private ensureUniqueInterestNames(interests: ImportedInterest[]) {
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const interest of interests) {
      const key = interest.name.toLowerCase();

      if (seen.has(key)) {
        duplicates.push(interest.name);
      }

      seen.add(key);
    }

    if (duplicates.length > 0) {
      throw new BadRequestException(
        `Duplicate interest names in JSON: ${[...new Set(duplicates)].join(', ')}`,
      );
    }
  }

  private createEmptyCategoryBreakdown(): Record<InterestCategory, number> {
    return ALL_INTEREST_CATEGORIES.reduce(
      (acc, category) => {
        acc[category] = 0;
        return acc;
      },
      {} as Record<InterestCategory, number>,
    );
  }

  private calculateCategoryBreakdown(
    interests: ImportedInterest[],
  ): Record<InterestCategory, number> {
    return interests.reduce((acc, interest) => {
      acc[interest.category] += 1;
      return acc;
    }, this.createEmptyCategoryBreakdown());
  }
}
