import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { type RoomLanguage } from '@prisma/client';
import { RandomMatchRepository, type RandomMatchFilters } from './random-match.repository';
import { StartRandomMatchDto } from './dto/start-random-match.dto';
import { RandomMatchResponseDto } from './dto/random-match-response.dto';
import { buildBirthDateBounds, calculateAge, dedupe } from './random-match.utils';

@Injectable()
export class RandomMatchService {
  constructor(private readonly randomMatchRepository: RandomMatchRepository) {}

  async startMatch(
    userId: string,
    tenantId: string,
    dto: StartRandomMatchDto,
  ): Promise<RandomMatchResponseDto> {
    if (!tenantId) {
      throw new BadRequestException('Tenant missing');
    }

    const user = await this.randomMatchRepository.getUserForMatch(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profileInterestIds = user.userInterests.map((interest) => interest.interestId);
    const effectiveLanguage: RoomLanguage | undefined =
      dto.uiLanguage ?? user.data?.language ?? undefined;

    const hasCustomFilters =
      dto.genders !== undefined ||
      dto.languages !== undefined ||
      dto.minAge !== undefined ||
      dto.maxAge !== undefined ||
      dto.interestIds !== undefined;

    const filters = hasCustomFilters
      ? await this.buildFiltersFromDto({
          userId,
          dto,
          profileInterestIds,
          effectiveLanguage,
        })
      : await this.buildFiltersFromPreferencesOrBase({
          userId,
          profileInterestIds,
          effectiveLanguage,
        });

    const match = await this.randomMatchRepository.findRandomMatch({
      userId,
      tenantId,
      filters,
    });

    if (!match) {
      return {
        match: null,
        message: 'No matches found. Try adjusting your filters.',
      };
    }

    return {
      match: {
        id: match.id,
        firstName: match.data?.firstName ?? undefined,
        lastName: match.data?.lastName ?? undefined,
        avatar: match.data?.avatar ?? undefined,
        age: calculateAge(match.data?.birthDate),
        gender: match.data?.gender ?? undefined,
        interests: match.userInterests.map((userInterest) => userInterest.interest),
      },
    };
  }

  private async buildFiltersFromDto(params: {
    userId: string;
    dto: StartRandomMatchDto;
    profileInterestIds: string[];
    effectiveLanguage?: RoomLanguage;
  }): Promise<RandomMatchFilters> {
    const { userId, dto, profileInterestIds, effectiveLanguage } = params;

    const genders = dto.genders ? dedupe(dto.genders) : [];
    const languages =
      dto.languages !== undefined
        ? dedupe(dto.languages)
        : effectiveLanguage
          ? [effectiveLanguage]
          : [];

    const interestIds =
      dto.interestIds !== undefined ? dedupe(dto.interestIds) : dedupe(profileInterestIds);

    if (dto.interestIds?.length) {
      const count = await this.randomMatchRepository.countInterestsByIds(interestIds);
      if (count !== interestIds.length) {
        throw new NotFoundException('One or more interests not found');
      }
    }

    const { birthDateMin, birthDateMax } = buildBirthDateBounds(dto.minAge, dto.maxAge);

    await this.randomMatchRepository.upsertPreferences({
      userId,
      minAge: dto.minAge,
      maxAge: dto.maxAge,
      genders,
      languages,
      interestIds,
    });

    return {
      genders: genders.length ? genders : undefined,
      languages: languages.length ? languages : undefined,
      interestIds: interestIds.length ? interestIds : undefined,
      birthDateMin,
      birthDateMax,
    };
  }

  private async buildFiltersFromPreferencesOrBase(params: {
    userId: string;
    profileInterestIds: string[];
    effectiveLanguage?: RoomLanguage;
  }): Promise<RandomMatchFilters> {
    const { userId, profileInterestIds, effectiveLanguage } = params;
    const preferences = await this.randomMatchRepository.getPreferences(userId);

    if (preferences) {
      const prefInterestIds = preferences.interests.map((interest) => interest.interestId);
      const { birthDateMin, birthDateMax } = buildBirthDateBounds(
        preferences.minAge ?? undefined,
        preferences.maxAge ?? undefined,
      );

      return {
        genders: preferences.genders.length ? preferences.genders : undefined,
        languages: preferences.languages.length ? preferences.languages : undefined,
        interestIds: prefInterestIds.length ? prefInterestIds : undefined,
        birthDateMin,
        birthDateMax,
      };
    }

    return {
      genders: undefined,
      languages: effectiveLanguage ? [effectiveLanguage] : undefined,
      interestIds: profileInterestIds.length ? profileInterestIds : undefined,
      birthDateMin: undefined,
      birthDateMax: undefined,
    };
  }
}
