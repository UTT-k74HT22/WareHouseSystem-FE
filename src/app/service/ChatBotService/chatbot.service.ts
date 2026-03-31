import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseURL } from '../../../environments/BaseURL';

export interface ChatBotRequest {
  message: string;
  conversationId?: string;
}

export interface ChatBotResponse {
  reply: string;
  conversationId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatBotService {
  private readonly API_URL = BaseURL.API_URL + 'chatbot/chat';
  private conversationId?: string;

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<ChatBotResponse> {
    const request: ChatBotRequest = {
      message,
      conversationId: this.conversationId
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
