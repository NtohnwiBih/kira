import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { PAYMENT_CONSTANTS } from '../constants/payment.constants';
 
@Injectable()
export class MtnMomoService {
  private readonly logger = new Logger(MtnMomoService.name);
  private readonly baseUrl: string;
  private readonly subscriptionKey: string;
  private readonly apiUser: string;
  private readonly apiKey: string;
 
  constructor(private readonly config: ConfigService) {
    const isProd = config.get('NODE_ENV') === 'production';
    this.baseUrl         = isProd ? PAYMENT_CONSTANTS.MOMO_BASE_URL_PROD : PAYMENT_CONSTANTS.MOMO_BASE_URL_SANDBOX;
    this.subscriptionKey = config.get<string>('MTN_MOMO_SUBSCRIPTION_KEY', '');
    this.apiUser         = config.get<string>('MTN_MOMO_API_USER', '');
    this.apiKey          = config.get<string>('MTN_MOMO_API_KEY', '');
  }
 
  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');
    const resp = await axios.post(
      `${this.baseUrl}/collection/token/`,
      {},
      {
        headers: {
          Authorization:           `Basic ${credentials}`,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
      },
    );
    return resp.data.access_token;
  }
 
  /**
   * Sends a RequestToPay to the customer's MTN MoMo number.
   * Returns the provider reference UUID (used for status polling).
   */
  async requestToPay(params: {
    amount:      number;
    currency:    string;
    phoneNumber: string;
    orderId:     string;
    paymentId:   string;
  }): Promise<string> {
    const referenceId = uuidv4();
    const token       = await this.getAccessToken();
 
    await axios.post(
      `${this.baseUrl}/collection/${PAYMENT_CONSTANTS.MOMO_API_VERSION}/requesttopay`,
      {
        amount:          String(params.amount),
        currency:        params.currency,
        externalId:      params.paymentId,
        payer:           { partyIdType: 'MSISDN', partyId: `237${params.phoneNumber}` },
        payerMessage:    `Kira Order ${params.orderId}`,
        payeeNote:       `Payment for order ${params.orderId}`,
      },
      {
        headers: {
          Authorization:               `Bearer ${token}`,
          'X-Reference-Id':            referenceId,
          'X-Target-Environment':      this.config.get('NODE_ENV') === 'production' ? 'mtncameroon' : 'sandbox',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type':              'application/json',
        },
      },
    );
 
    this.logger.log(`MTN MoMo RequestToPay sent ref=${referenceId} order=${params.orderId}`);
    return referenceId;
  }
 
  async getTransactionStatus(referenceId: string): Promise<{
    status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
    reason?: string;
  }> {
    const token = await this.getAccessToken();
    const resp  = await axios.get(
      `${this.baseUrl}/collection/${PAYMENT_CONSTANTS.MOMO_API_VERSION}/requesttopay/${referenceId}`,
      {
        headers: {
          Authorization:               `Bearer ${token}`,
          'X-Target-Environment':      this.config.get('NODE_ENV') === 'production' ? 'mtncameroon' : 'sandbox',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
      },
    );
    return { status: resp.data.status, reason: resp.data.reason };
  }
}