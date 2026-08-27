import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateInspectionDto } from '../src/inspection/dto/create-inspection.dto';
import { InspectionService } from '../src/inspection/inspection.service';
import { InspectionJudgmentService } from '../src/inspection/inspection-judgment.service';
import { InspectionRepository } from '../src/inspection/inspection.repository';

describe('Inspection API validation', () => {
  it('rejects a non-numeric sunpou with the legacy message', async () => {
    const dto = plainToInstance(CreateInspectionDto, {
      shiji_no: 'SJ-2608-0002',
      lot_no: 'LOT-TEST',
      kensa_sha: '高橋 花子',
      sunpou: 'not-a-number',
      kijun_min: '219.900',
      kijun_max: '220.100',
      furyo_naiyo: '',
    });

    const errors = await validate(dto);
    expect(errors.find((error) => error.property === 'sunpou')?.constraints).toEqual(
      expect.objectContaining({
        matches: '測定値は数値で入力してください。',
      }),
    );
  });

  it('uses a 400 Bad Request for failed validation', async () => {
    const pipe = new ValidationPipe({ transform: true });
    const repository = {
      create: jest.fn(),
    } as unknown as InspectionRepository;
    const service = new InspectionService(
      repository,
      new InspectionJudgmentService(),
    );
    await expect(
      pipe.transform(
        { sunpou: 'not-a-number' },
        { type: 'body', metatype: CreateInspectionDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
    expect(service).toBeDefined();
  });
});
