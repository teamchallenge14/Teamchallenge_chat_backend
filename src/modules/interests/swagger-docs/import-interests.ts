import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

export const ImportInterestsDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Import interests from JSON file (temporary public admin route)' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'JSON file with format: { "CATEGORY": ["Interest 1", ...], ... }',
          },
        },
        required: ['file'],
      },
    }),
    ApiOkResponse({
      description:
        'Interests import result. Import is skipped if the interests table already has records.',
      schema: {
        example: {
          status: 'imported',
          message: 'Interests imported successfully',
          existingCount: 0,
          insertedCount: 120,
          totalInFile: 120,
          categoryBreakdown: {
            OTHER: 30,
            ENTERTAINMENT: 15,
            CREATIVITY: 15,
            LEARNING: 15,
            DEEP_TALKS: 15,
            SPORTS_FITNESS: 15,
            LIFESTYLE: 15,
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        'Invalid or empty JSON file, unsupported categories, invalid values, or duplicates.',
    }),
  );
