import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseURL } from '../../../environments/BaseURL';

export enum ChatBotIntent {
  GREETING = 'GREETING',
  HELP = 'HELP',
  PRODUCT_LOOKUP = 'PRODUCT_LOOKUP',
  INVENTORY_SUMMARY = 'INVENTORY_SUMMARY',
  INVENTORY_BY_LOCATION = 'INVENTORY_BY_LOCATION',
  BATCH_EXPIRING = 'BATCH_EXPIRING',
  WAREHOUSE_LOOKUP = 'WAREHOUSE_LOOKUP',
  PARTNER_LOOKUP = 'PARTNER_LOOKUP',
  INBOUND_LOOKUP = 'INBOUND_LOOKUP',
  OUTBOUND_LOOKUP = 'OUTBOUND_LOOKUP',
  SYSTEM_GUIDE = 'SYSTEM_GUIDE',
  UNKNOWN = 'UNKNOWN'
}

export interface ChatBotSuggestion {
  label: string;
  intent: ChatBotIntent;
  sku?: string;
  query?: string;
  requiresInput?: boolean;
}

export interface ChatBotRequest {
  message?: string;
  conversationId?: string;
  intent?: ChatBotIntent;
  payload?: { [key: string]: any };
}

export interface ChatBotResponse {
  reply: string;
  conversationId?: string;
  suggestions?: ChatBotSuggestion[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatBotService {
  private readonly API_URL = BaseURL.API_URL + 'chatbot/chat';
  private conversationId?: string;

  constructor(private http: HttpClient) {}

  sendMessage(message?: string, intent?: ChatBotIntent, payload?: { [key: string]: any }): Observable<ChatBotResponse> {
    const request: ChatBotRequest = {
      message,
      conversationId: this.conversationId,
      intent,
      payload
    };

    return this.http.post<ChatBotResponse>(this.API_URL, request).pipe(
      tap((response) => {
        if (response?.conversationId) {
          this.conversationId = response.conversationId;
        }
      })
    );
  }

  resetConversation(): void {
    this.conversationId = undefined;
  }
}
