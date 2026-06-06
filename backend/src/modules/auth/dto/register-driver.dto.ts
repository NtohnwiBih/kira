import { IsString, MinLength, MaxLength, Matches, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RegisterDto } from './register.dto';

export class RegisterDriverDto extends RegisterDto {
  @ApiProperty({ example: '+237612345678' })
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Please provide a valid phone number including country code (e.g. +237612345678).' })
  driverPhone: string;

  @ApiProperty({ example: 'ABC-1234', description: 'Uppercase letters, numbers, and hyphens only' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[A-Z0-9-]{3,20}$/, { message: 'Vehicle plate must contain only uppercase letters, numbers, and hyphens.' })
  vehiclePlate: string;
}