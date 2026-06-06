import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,128}$/;

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'John Doe', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ example: 'Secret123!', description: 'Min 8 chars, uppercase, lowercase, number and special character' })
  @IsString()
  @Matches(PASSWORD_REGEX, {
    message: 'Password must be 8–128 characters and include uppercase, lowercase, a number, and a special character.',
  })
  password: string;

  @ApiPropertyOptional({ example: '+237612345678' })
  @IsOptional()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Please provide a valid phone number including country code (e.g. +237612345678).' })
  phone?: string;
}