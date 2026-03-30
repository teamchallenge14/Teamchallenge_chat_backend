import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { CreateInterestDto } from './dto/create-interests.dto';
import { GetInterestsQueryDto } from './dto/get-interests.query.dto';
import { PaginatedInterestsDto } from './dto/paginated-interests.dto';
import { UpdateInterestDto } from './dto/update-interests.dto';
import { ImportInterestsResult, InterestsService } from './interests.service';
import { routesV1 } from '@src/config';
import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';
import { Public } from '@src/common/decorators';

const MAX_JSON_FILE_SIZE = 1024 * 1024;

@ApiTags(routesV1.interests.root)
@Controller(routesV1.version)
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  // create interests
  @Public()
  @Post(routesV1.interests.create)
  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Create interest' })
  create(@Body() dto: CreateInterestDto) {
    return this.interestsService.create(dto);
  }

  // TODO: make this route admin-only once admin permissions are added
  @Public()
  @Post(routesV1.interests.import)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        files: 1,
        fileSize: MAX_JSON_FILE_SIZE,
      },
      fileFilter: (_req, file, cb) => {
        const hasJsonMime = file.mimetype === 'application/json' || file.mimetype === 'text/json';
        const hasJsonExtension = file.originalname?.toLowerCase().endsWith('.json');

        if (!hasJsonMime && !hasJsonExtension) {
          return cb(new BadRequestException('Only JSON files are allowed'), false);
        }

        return cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Import interests from JSON file (temporary public admin route)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
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
  })
  importFromJson(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ImportInterestsResult> {
    return this.interestsService.importFromJsonFile(file);
  }

  // find all
  @Public()
  @Get(routesV1.interests.findAll)
  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @ApiOperation({
    summary: 'Get interests list',
    description: 'Returns interests with optional category filter, search by name, and pagination.',
  })
  @ApiOkResponse({ type: PaginatedInterestsDto })
  findAll(@Query() query: GetInterestsQueryDto): Promise<PaginatedInterestsDto> {
    return this.interestsService.findAll(query);
  }

  // find one
  @Public()
  @Get(routesV1.interests.findOne)
  @ApiOperation({ summary: 'Get interest by id' })
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.interestsService.findOne(id);
  }

  // update

  @Public()
  @Patch(routesV1.interests.update)
  @ApiOperation({ summary: 'Update interest' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateInterestDto) {
    return this.interestsService.update(id, dto);
  }

  // delete
  @Public()
  @Delete(routesV1.interests.delete)
  @ApiOperation({ summary: 'Delete interest' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.interestsService.remove(id);
  }
}
