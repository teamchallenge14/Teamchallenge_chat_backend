import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';
import { RandomMatchResponseDto } from '../dto/random-match-response.dto';
import { StartRandomMatchDto } from '../dto/start-random-match.dto';

export const StartRandomMatchDocs = () =>
  applyDecorators(
    ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN),
    ApiOperation({
      summary: 'Start random matching',
      description:
        'Starts random matching using optional filters. If no filters are provided, saved preferences are used; if none exist, base settings are applied.',
    }),
    ApiBody({ type: StartRandomMatchDto, required: false }),
    ApiOkResponse({
      description: 'Random match result (null if no match found; message provided)',
      type: RandomMatchResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. User must be authenticated.',
    }),
    ApiForbiddenResponse({
      description: 'Forbidden. User is not active or has no permission.',
    }),
    ApiBadRequestResponse({
      description: 'Validation error or invalid age range.',
    }),
    ApiNotFoundResponse({
      description: 'User not found or one or more interests not found.',
    }),
  );
