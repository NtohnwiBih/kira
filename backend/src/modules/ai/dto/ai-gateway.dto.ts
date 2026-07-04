import { IsString, IsOptional, IsNumber, Min, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
 
export class ChatRequestDto {
  @ApiProperty({ example: 'What should I eat tonight?' })
  @IsString() @MaxLength(4000)
  message: string;
}
 
export class ChatResponseDto {
  @ApiProperty() reply:      string;
  @ApiProperty() modelUsed:  string;
  @ApiProperty() requestId:  string;
}
 
export class SearchQueryDto {
  @ApiProperty({ example: 'I want spicy chicken under 5000 XAF' })
  @IsString() @MaxLength(500)
  query: string;
}
 
export class RecommendationResultDto {
  @ApiProperty({ isArray: true, type: String }) keywords:  string[];
  @ApiProperty({ nullable: true })              maxPrice:  number | null;
  @ApiProperty({ isArray: true, type: String }) tags:      string[];
}
 
export class RecommendationResponseDto {
  @ApiProperty({ type: () => RecommendationResultDto })
  result: RecommendationResultDto;
  @ApiProperty() modelUsed: string;
}
 
export class SupportQuestionDto {
  @ApiProperty({ example: 'Where is my order?' })
  @IsString() @MaxLength(2000)
  question: string;
}
 
export class SupportResponseDto {
  @ApiProperty() answer:    string;
  @ApiProperty() modelUsed: string;
}