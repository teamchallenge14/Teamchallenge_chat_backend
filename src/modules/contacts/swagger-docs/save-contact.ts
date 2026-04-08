import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';
import { CreateContactDto } from '../dto/create-contact.dto';
import { CreateContactResponseDto } from '../dto/create-contact.response.dto';

export const SaveContactDocs = () =>
  applyDecorators(
    ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN),
    ApiOperation({
      summary: 'Save contact',
      description:
        'Saves another user as a contact for quick access. Requires authentication and tenant context.',
    }),
    ApiBody({ type: CreateContactDto }),
    ApiCreatedResponse({
      description: 'Contact saved successfully',
      type: CreateContactResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. User must be authenticated.',
    }),
    ApiForbiddenResponse({
      description:
        'Forbidden. User cannot save contacts (anonymous/guest user or target privacy restriction).',
    }),
    ApiBadRequestResponse({
      description: 'Validation error or user tries to add self as contact.',
    }),
    ApiNotFoundResponse({
      description: 'Target user not found in current tenant or inactive.',
    }),
    ApiConflictResponse({
      description: 'Contact already added.',
    }),
    ApiUnprocessableEntityResponse({
      description: 'Target user is anonymous and cannot be added to contacts.',
    }),
  );
