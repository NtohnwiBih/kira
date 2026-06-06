import { IsString, Length, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: '482910', description: '6-digit verification code sent to your email' })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits.' })
  code: string;
}