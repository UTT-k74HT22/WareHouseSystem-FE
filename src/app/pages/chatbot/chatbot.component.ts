import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ChatBotService } from '../../service/ChatBotService/chatbot.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import {
  CHATBOT_CONNECTION_ERROR,
  CHATBOT_INPUT_PLACEHOLDER,
  CHATBOT_INVALID_RESPONSE,
  CHATBOT_PANEL_STATUS,
  CHATBOT_PANEL_TITLE,
  CHATBOT_SUGGESTIONS,
  CHATBOT_WELCOME_MESSAGE
} from '../../service/ChatBotService/chatbot-ui-content';

export interface Message {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatBotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: Message[] = [];
  newMessage = '';
  isLoading = false;

  readonly suggestions = CHATBOT_SUGGESTIONS;
  readonly panelTitle = CHATBOT_PANEL_TITLE;
  readonly panelStatus = CHATBOT_PANEL_STATUS;
  readonly inputPlaceholder = CHATBOT_INPUT_PLACEHOLDER;

  private shouldScroll = false;

  constructor(
    private chatBotService: ChatBotService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.addWelcomeMessage();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  sendMessage(): void {
    const trimmedMessage = this.newMessage.trim();
    if (!trimmedMessage || this.isLoading) {
      return;
    }

    this.messages.push({
      id: Date.now(),
      content: trimmedMessage,
      sender: 'user',
      timestamp: new Date()
    });

    this.newMessage = '';
    this.shouldScroll = true;

    this.messages.push({
      id: Date.now() + 1,
      content: '',
      sender: 'bot',
      timestamp: new Date(),
      isLoading: true
    });

    this.isLoading = true;
    this.shouldScroll = true;

    this.chatBotService.sendMessage(trimmedMessage).subscribe({
      next: (res) => {
        this.removeLoadingMessage();
        this.messages.push({
          id: Date.now() + 2,
          content: res?.reply?.trim() || CHATBOT_INVALID_RESPONSE,
          sender: 'bot',
          timestamp: new Date()
        });
        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: (error: HttpErrorResponse) => {
        this.removeLoadingMessage();
        this.messages.push({
          id: Date.now() + 2,
          content: this.extractErrorMessage(error),
          sender: 'bot',
          timestamp: new Date()
        });
        this.isLoading = false;
        this.shouldScroll = true;
        this.toastr.error('Chatbot trả về lỗi');
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    this.chatBotService.resetConversation();
    this.messages = [];
    this.addWelcomeMessage();
    this.shouldScroll = true;
  }

  sendSuggestion(suggestion: string): void {
    this.newMessage = suggestion;
    this.sendMessage();
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private addWelcomeMessage(): void {
    this.messages.push({
      id: 1,
      content: CHATBOT_WELCOME_MESSAGE,
      sender: 'bot',
      timestamp: new Date()
    });
    this.shouldScroll = true;
  }

  private removeLoadingMessage(): void {
    const loadingIdx = this.messages.findIndex((message) => message.isLoading);
    if (loadingIdx !== -1) {
      this.messages.splice(loadingIdx, 1);
    }
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const payload = error?.error;

    if (typeof payload === 'string' && payload.trim()) {
      return payload.trim();
    }

    if (payload?.reply && typeof payload.reply === 'string' && payload.reply.trim()) {
      return payload.reply.trim();
    }

    if (payload?.message && typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    if (payload?.errorCode && payload?.message) {
      return `${payload.message}`;
    }

    if (error.status === 401 || error.status === 403) {
      return 'Bạn chưa được cấp quyền để sử dụng chatbot này. Hãy đăng nhập lại hoặc kiểm tra token.';
    }

    return CHATBOT_CONNECTION_ERROR;
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
