import {
  ServiceUnavailableException,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
 
export class AiGatewayUnavailableException extends ServiceUnavailableException {
  constructor() {
    super('The AI service is temporarily unavailable. Please try again shortly.');
  }
}
 
export class AiGatewayTimeoutException extends BadGatewayException {
  constructor() {
    super('The AI service did not respond in time. Please try again.');
  }
}
 
export class AiGatewayUnauthorizedException extends InternalServerErrorException {
  constructor() {
    super('AI Gateway authentication misconfigured. Contact support.');
  }
}