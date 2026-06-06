import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  error: string;

  @ApiProperty({ example: 'Authentication required.' })
  message: string;

  @ApiProperty({ example: '2025-11-01T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/restaurants' })
  path: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({
    example: [
      'name must be longer than or equal to 3 characters',
      'phone must be a valid Cameroon phone number',
    ],
    isArray: true,
    type: String,
  })
  message: string[];

  @ApiProperty({ example: '2025-11-01T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/restaurants' })
  path: string;
}