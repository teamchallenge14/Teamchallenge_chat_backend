import { CreatedUserDto } from '@/modules/auth/dto/created-user.dto';
import { AuthProvider } from '@/modules/auth/enums/auth-provider.enum';

declare global {
  namespace Express {
    interface Request {
      user?:
        | CreatedUserDto
        | {
            id?: string;
            provider?: AuthProvider;
            providerId?: string;
            email?: string;
            login?: string;
          };
    }
  }
}

export {};
