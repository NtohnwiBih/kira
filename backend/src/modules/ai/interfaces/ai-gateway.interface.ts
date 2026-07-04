export interface IChatRequest {
  userId:  string;
  message: string;
}
 
export interface IChatResponse {
  reply:      string;
  userId:     string;
  requestId:  string;
  modelUsed:  string;
}
 
export interface IRecommendationRequest {
  userId: string;
  query:  string;
}
 
export interface IRecommendationResult {
  keywords:  string[];
  maxPrice:  number | null;
  tags:      string[];
}
 
export interface IRecommendationResponse {
  result:    IRecommendationResult;
  userId:    string;
  requestId: string;
  modelUsed: string;
}
 
export interface ISupportContext {
  status?:           string;
  driverName?:       string;
  estimatedMinutes?: number;
  restaurantName?:   string;
  orderNumber?:      string;
  paymentStatus?:    string;
  [key: string]:     unknown;
}
 
export interface ISupportRequest {
  userId:   string;
  question: string;
  context:  ISupportContext;
}
 
export interface ISupportResponse {
  answer:    string;
  userId:    string;
  requestId: string;
  modelUsed: string;
}