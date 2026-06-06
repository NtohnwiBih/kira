import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }     from '@nestjs/config';
import axios                  from 'axios';
import { PAYMENT_CONSTANTS } from '../constants/payment.constants';
 
@Injectable()
export class OrangeMoneyService {
  private readonly logger = new Logger(OrangeMoneyService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly merchantKey: string;
 
  constructor(private readonly config: ConfigService) {
    const isProd     = config.get('NODE_ENV') === 'production';
    this.baseUrl      = isProd ? PAYMENT_CONSTANTS.OM_BASE_URL_PROD : PAYMENT_CONSTANTS.OM_BASE_URL_SANDBOX;
    this.clientId     = config.get<string>('OM_CLIENT_ID', '');
    this.clientSecret = config.get<string>('OM_CLIENT_SECRET', '');
    this.merchantKey  = config.get<string>('OM_MERCHANT_KEY', '');
  }
 
  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const resp = await axios.post(
      'https://api.orange.com/oauth/v3/token',
      'grant_type=client_credentials',
      { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    return resp.data.access_token;
  }
 
  async requestToPay(params: {
    amount:      number;
    currency:    string;
    phoneNumber: string;
    orderId:     string;
    paymentId:   string;
    notifyUrl:   string;
  }): Promise<{ payToken: string }> {
    const token = await this.getAccessToken();
    const resp  = await axios.post(
      `${this.baseUrl}/webpayment`,
      {
        merchant_key:  this.merchantKey,
        currency:      params.currency,
        order_id:      params.paymentId,
        amount:        params.amount,
        return_url:    params.notifyUrl,
        cancel_url:    params.notifyUrl,
        notif_url:     params.notifyUrl,
        lang:          'fr',
        reference:     params.orderId,
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    return { payToken: resp.data.pay_token };
  }
 
  async getTransactionStatus(orderRef: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    txnId?: string;
  }> {
    const token = await this.getAccessToken();
    const resp  = await axios.get(
      `${this.baseUrl}/transactionstatus?order_id=${orderRef}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const raw = resp.data.status;
    const status = raw === '60000' ? 'SUCCESS' : raw === '60019' ? 'PENDING' : 'FAILED';
    return { status, txnId: resp.data.txnid };
  }
}