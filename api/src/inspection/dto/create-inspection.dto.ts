import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const decimalMessage = '測定値は数値で入力してください。';
const decimalPattern = /^-?(?:\d+|\d+\.\d{1,3})$/;
const asString = ({ value }: { value: unknown }): string =>
  value === undefined || value === null ? '' : String(value);

export class CreateInspectionDto {
  @Transform(asString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  shiji_no!: string;

  @Transform(asString)
  @IsString()
  @MaxLength(30)
  lot_no!: string;

  @Transform(asString)
  @IsString()
  @MaxLength(60)
  kensa_sha!: string;

  @Transform(asString)
  @Matches(decimalPattern, { message: decimalMessage })
  sunpou!: string;

  @Transform(asString)
  @Matches(decimalPattern, { message: '規格下限は数値で入力してください。' })
  kijun_min!: string;

  @Transform(asString)
  @Matches(decimalPattern, { message: '規格上限は数値で入力してください。' })
  kijun_max!: string;

  @Transform(asString)
  @IsString()
  @IsOptional()
  @MaxLength(255)
  furyo_naiyo = '';
}
