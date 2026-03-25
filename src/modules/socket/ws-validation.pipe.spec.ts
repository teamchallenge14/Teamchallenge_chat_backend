import { type ArgumentMetadata } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { CreateRoomPayloadDto } from './dto/create-room.payload';
import { JoinRoomPayloadDto } from './dto/join-room.payload';
import { WsValidationPipe } from './ws-validation.pipe';

describe('WsValidationPipe', () => {
  const pipe = new WsValidationPipe();

  const buildMetadata = (metatype: ArgumentMetadata['metatype']): ArgumentMetadata => ({
    type: 'body',
    metatype,
    data: '',
  });

  it('returns typed dto for valid payload', async () => {
    const value = await pipe.transform(
      { roomId: '550e8400-e29b-41d4-a716-446655440000' },
      buildMetadata(JoinRoomPayloadDto),
    );

    expect(value).toBeInstanceOf(JoinRoomPayloadDto);
    expect((value as JoinRoomPayloadDto).roomId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('throws WsException for invalid dto fields', async () => {
    await expect(
      pipe.transform({ roomId: 'not-uuid' }, buildMetadata(JoinRoomPayloadDto)),
    ).rejects.toBeInstanceOf(WsException);
  });

  it('throws WsException for non-whitelisted fields', async () => {
    await expect(
      pipe.transform(
        {
          name: 'Room',
          type: 'PUBLIC',
          languages: ['EN'],
          extra: true,
        },
        buildMetadata(CreateRoomPayloadDto),
      ),
    ).rejects.toBeInstanceOf(WsException);
  });
});
