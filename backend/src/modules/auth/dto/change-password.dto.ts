import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_REGEX } from './register.dto';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldSecret123!' })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({ example: 'NewSecret123!' })
  @IsString()
  @Matches(PASSWORD_REGEX, { message: 'New password must be 8–128 characters and include uppercase, lowercase, a number, and a special character.' })
  newPassword: string;
}