import { type RoomLanguage, type RoomType } from '@prisma/client';

export type CreateRoomInput = {
  name: string;
  type: RoomType;
  minAge?: number;
  maxAge?: number;
  languages: RoomLanguage[];
  interestIds?: string[];
};
