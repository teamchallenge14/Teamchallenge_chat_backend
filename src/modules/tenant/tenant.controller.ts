import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import {
  CreateTenantRequestDto,
  CreateTenantResponseDto,
  UpdateTenantRequestDto,
  UpdateTenantResponseDto,
  CreateTenantDomainRequestDto,
  CreateTenantDomainResponseDto,
  UpdateTenantDomainRequestDto,
} from '@src/modules/tenant/dto';
import { Public } from '@src/common/decorators/public.decorator';
import { AddUserToTenantDto } from '@src/modules/tenant/dto/add-user-to-tenant.requesr.dto';
import { routesV1 } from '@src/config';
import { RequirePermissions } from '@src/common/decorators';
import { Permission } from '@prisma/client';

@ApiTags(routesV1.tenant.root)
@Controller(routesV1.version)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // Tenant CRUD

  // create tenant
  @Public()
  @Post(routesV1.tenant.create)
  @ApiOperation({ summary: 'create tenant' })
  @ApiResponse({ type: CreateTenantResponseDto })
  createTenant(@Body() dto: CreateTenantRequestDto) {
    return this.tenantService.createTenant(dto);
  }

  // get all tenants
  @Public()
  @Get(routesV1.tenant.findAll)
  @ApiOperation({ summary: 'get all tenants' })
  getAllTenants() {
    return this.tenantService.getAllTenants();
  }

  // find one tenant
  @Public()
  @Get(routesV1.tenant.findOne)
  @ApiOperation({ summary: 'get tenant by id' })
  getTenant(@Param('id') id: string) {
    return this.tenantService.getTenantById(id);
  }

  // update tenant
  @RequirePermissions([Permission.TENANT_UPDATE])
  @Put(routesV1.tenant.update)
  @ApiOperation({ summary: 'update tenant' })
  @ApiResponse({ type: UpdateTenantResponseDto })
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantRequestDto) {
    return this.tenantService.updateTenant(id, dto);
  }

  // delete tenant
  @RequirePermissions([Permission.TENANT_DELETE])
  @Delete(routesV1.tenant.delete)
  @ApiOperation({ summary: 'delete tenant' })
  deleteTenant(@Param('id') id: string) {
    return this.tenantService.deleteTenant(id);
  }

  // TenantDomain CRUD

  // create tenant domain
  @Public()
  @Post(routesV1.tenant.createDomain)
  @ApiOperation({ summary: 'create tenant domain' })
  @ApiResponse({ type: CreateTenantDomainResponseDto })
  createTenantDomain(@Body() dto: CreateTenantDomainRequestDto) {
    return this.tenantService.createTenantDomain(dto);
  }

  // get all tenants domain
  @Public()
  @Get(routesV1.tenant.findAllDomains)
  getAllTenantDomains() {
    return this.tenantService.getAllTenantDomains();
  }

  // get tenant domain by id
  @Public()
  @Get(routesV1.tenant.findOneDomain)
  getTenantDomain(@Param('id') id: string) {
    return this.tenantService.getTenantDomainById(id);
  }

  // update tenant domain
  @RequirePermissions([Permission.TENANT_UPDATE])
  @Put(routesV1.tenant.updateDomain)
  updateTenantDomain(@Param('id') id: string, @Body() dto: UpdateTenantDomainRequestDto) {
    return this.tenantService.updateTenantDomain(id, dto);
  }

  // delete tenant domain
  @RequirePermissions([Permission.TENANT_DELETE])
  @Delete(routesV1.tenant.deleteDomain)
  deleteTenantDomain(@Param('id') id: string) {
    return this.tenantService.deleteTenantDomain(id);
  }

  // add user to tenant
  @RequirePermissions([Permission.TENANT_MODERATE])
  @Post(routesV1.tenant.addUser)
  @ApiOperation({ summary: 'Add existing user to tenant' })
  @ApiParam({
    name: 'tenantId',
    example: 'tenant-uuid',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully added to tenant',
  })
  async addUserToTenant(@Param('tenantId') tenantId: string, @Body() dto: AddUserToTenantDto) {
    return this.tenantService.addUserToTenant(tenantId, dto);
  }
}
