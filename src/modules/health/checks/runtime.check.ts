import { type CheckResultDto } from '../dto/check-result.dto';

export function runtimeCheck(): CheckResultDto {
  return { status: 'healthy' };
}
