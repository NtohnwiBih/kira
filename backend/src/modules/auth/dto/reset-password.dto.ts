import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_REGEX } from './register.dto';

export class ResetPasswordDto {
  @ApiProperty({ example: '482910', description: '6-digit reset code sent to your email' })
  @IsString()
  @Length(6, 6, { message: 'Reset code must be exactly 6 digits.' })
  token: string;

  @ApiProperty({ example: 'NewSecret123!' })
  @IsString()
  @Matches(PASSWORD_REGEX, {
    message: 'Password must be 8–128 characters and include uppercase, lowercase, a number, and a special character.',
  })
  newPassword: string;
}