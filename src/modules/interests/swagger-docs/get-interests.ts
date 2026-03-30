import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';
import { PaginatedInterestsDto } from '../dto/paginated-interests.dto';

export const GetInterestsDocs = () =>
  applyDecorators(
    ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN),
    ApiOperation({
      summary: 'Get interests list',
      description:
        'Returns interests with optional category filter, search by name, and pagination.',
    }),
    ApiOkResponse({
      description: 'Interests successfully retrieved',
      type: PaginatedInterestsDto,
    }),
    ApiBadRequestResponse({
      description: 'Validation error in query parameters.',
      schema: {
        example: {
          statusCode: 400,
          error: 'BadRequestException',
          message: ['search must be longer than or equal to 3 characters'],
          path: '/v1/interests?search=fo',
          timestamp: '2026-03-30T12:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 503,
      description: 'Database is unavailable or storage is temporarily not ready.',
      schema: {
        example: {
          statusCode: 503,
          error: 'ServiceUnavailableException',
          message: 'Failed to fetch interests from database',
          path: '/v1/interests?search=foot&page=1&limit=10',
          timestamp: '2026-03-30T12:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 504,
      description: 'Database query timeout.',
      schema: {
        example: {
          statusCode: 504,
          error: 'GatewayTimeoutException',
          message: 'Database query timed out',
          path: '/v1/interests?search=football&page=1&limit=10',
          timestamp: '2026-03-30T12:00:00.000Z',
        },
      },
    }),
  );
