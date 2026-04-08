import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';
import { CreateContactResponseDto } from '../dto/create-contact.response.dto';

export const RemoveContactDocs = () =>
  applyDecorators(
    ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN),
    ApiOperation({
      summary: 'Remove contact',
      description: 'Removes a previously saved contact from current user contact list.',
    }),
    ApiParam({
      name: 'contactUserId',
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Contact user id to remove from list',
    }),
    ApiOkResponse({
      description: 'Contact removed successfully',
      type: CreateContactResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. User must be authenticated.',
    }),
    ApiForbiddenResponse({
      description: 'Forbidden. User cannot manage contacts (anonymous/guest user).',
    }),
    ApiBadRequestResponse({
      description: 'Validation error or user tries to remove self from contacts.',
    }),
    ApiNotFoundResponse({
      description: 'Contact is not in user contact list.',
    }),
  );
