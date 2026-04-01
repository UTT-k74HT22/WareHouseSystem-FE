import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatBubbleService } from '../../service/ChatBotService/chat-bubble.service';
import {
  ChatBotIntent,
  ChatBotResponse,
  ChatBotService,
  ChatBotSuggestion
} from '../../service/ChatBotService/chatbot.service';
import {
  CHATBOT_CONNECTION_ERROR,
  CHATBOT_FOLLOWUP_SUGGESTIONS,
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

export interface Suggestion {
  label: string;
  intent: ChatBotIntent;
  sku?: string;
  query?: string;
  requiresInput?: boolean;
}

@Component({
  selector: 'app-chat-bubble',
  templateUrl: './chat-bubble.component.html',
  styleUrls: ['./chat-bubble.component.css']
})
export class ChatBubbleComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  messages: Message[] = [];
  newMessage = '';
  isLoading = false;

  readonly suggestions: Suggestion[] = CHATBOT_SUGGESTIONS;
  readonly followupSuggestions: Suggestion[] = CHATBOT_FOLLOWUP_SUGGESTIONS;
  readonly panelTitle = CHATBOT_PANEL_TITLE;
  readonly panelStatus = CHATBOT_PANEL_STATUS;
  readonly inputPlaceholder = CHATBOT_INPUT_PLACEHOLDER;

  private backendSuggestions: ChatBotSuggestion[] = [];
  private shouldScroll = false;
  private destroy$ = new Subject<void>();
  private readonly MAX_MESSAGE_LENGTH = 500;

  get showSuggestions(): boolean {
    if (this.isWelcomeState) {
      return this.currentSuggestions.length > 0;
    }

    const lastMessage = this.messages[this.messages.length - 1];
    return lastMessage?.sender === 'bot' && !lastMessage?.isLoading && this.currentSuggestions.length > 0;
  }

  get isWelcomeState(): boolean {
    return this.messages.length === 1 && this.messages[0].sender === 'bot';
  }

  get currentSuggestions(): Suggestion[] {
    if (this.isWelcomeState) {
      return this.suggestions;
    }

    if (this.backendSuggestions.length > 0) {
      return this.backendSuggestions.map((suggestion) => this.normalizeSuggestion(suggestion));
    }

    return this.followupSuggestions;
  }

  constructor(
    public chatBubbleService: ChatBubbleService,
    private chatBotService: ChatBotService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chatBubbleService.isOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOpen) => {
        this.isOpen = isOpen;
        if (isOpen && this.messages.length === 0) {
          this.addWelcomeMessage();
        }
      });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggle(): void {
    this.chatBubbleService.toggle();
  }

  sendSuggestion(suggestion: Suggestion): void {
    if (suggestion.requiresInput) {
      this.newMessage = suggestion.query ?? '';
      return;
    }

    this.backendSuggestions = [];
    this.shouldScroll = true;

    this.messages.push({
      id: Date.now(),
      content: suggestion.label,
      sender: 'user',
      timestamp: new Date()
    });

    this.messages.push({
      id: Date.now() + 1,
      content: '',
      sender: 'bot',
      timestamp: new Date(),
      isLoading: true
    });

    this.isLoading = true;

    const requestMessage = suggestion.sku ? undefined : (suggestion.query ?? suggestion.label);
    const payload = suggestion.sku ? { sku: suggestion.sku } : undefined;

    this.chatBotService.sendMessage(requestMessage, suggestion.intent, payload).subscribe({
      next: (res: ChatBotResponse) => {
        this.handleBotResponse(res);
        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: (error: HttpErrorResponse) => {
        this.handleBotError(error);
        this.isLoading = false;
        this.shouldScroll = true;
      }
    });
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
      next: (res: ChatBotResponse) => {
        this.handleBotResponse(res);
        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: (error: HttpErrorResponse) => {
        this.handleBotError(error);
        this.isLoading = false;
        this.shouldScroll = true;
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
    this.backendSuggestions = [];
    this.addWelcomeMessage();
    this.shouldScroll = true;
  }

  openFullPage(): void {
    this.chatBubbleService.close();
    this.router.navigate(['/chatbot']);
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

  private normalizeSuggestion(suggestion: ChatBotSuggestion): Suggestion {
    return {
      label: suggestion.label,
      intent: suggestion.intent,
      sku: suggestion.sku,
      query: suggestion.query ?? this.buildSuggestionQuery(suggestion),
      requiresInput: suggestion.requiresInput ?? this.suggestionNeedsInput(suggestion)
    };
  }

  private suggestionNeedsInput(suggestion: ChatBotSuggestion): boolean {
    if (suggestion.sku) {
      return false;
    }

    switch (suggestion.intent) {
      case ChatBotIntent.PRODUCT_LOOKUP:
      case ChatBotIntent.INVENTORY_SUMMARY:
      case ChatBotIntent.INVENTORY_BY_LOCATION:
      case ChatBotIntent.PARTNER_LOOKUP:
      case ChatBotIntent.INBOUND_LOOKUP:
      case ChatBotIntent.OUTBOUND_LOOKUP:
        return true;
      default:
        return false;
    }
  }

  private buildSuggestionQuery(suggestion: ChatBotSuggestion): string {
    if (suggestion.sku) {
      return suggestion.label;
    }

    switch (suggestion.intent) {
      case ChatBotIntent.PRODUCT_LOOKUP:
        return 'Tìm sản phẩm ';
      case ChatBotIntent.INVENTORY_SUMMARY:
        return 'Tồn kho ';
      case ChatBotIntent.INVENTORY_BY_LOCATION:
        return 'Tồn kho theo vị trí ';
      case ChatBotIntent.PARTNER_LOOKUP:
        return 'Thông tin đối tác ';
      case ChatBotIntent.INBOUND_LOOKUP:
        return 'Đơn nhập ';
      case ChatBotIntent.OUTBOUND_LOOKUP:
        return 'Đơn xuất ';
      case ChatBotIntent.WAREHOUSE_LOOKUP:
        return 'Xem danh sách các kho';
      case ChatBotIntent.BATCH_EXPIRING:
        return 'Liệt kê các batch sắp hết hạn trong 30 ngày';
      case ChatBotIntent.SYSTEM_GUIDE:
        return 'Hướng dẫn sử dụng hệ thống';
      case ChatBotIntent.HELP:
        return 'Tôi cần trợ giúp';
      case ChatBotIntent.GREETING:
        return 'Xin chào';
      default:
        return suggestion.label;
    }
  }

  private handleBotResponse(res: ChatBotResponse): void {
    this.removeLoadingMessage();
    const rawContent = res?.reply?.trim() || CHATBOT_INVALID_RESPONSE;
    const truncatedContent = this.truncateMessage(rawContent);

    this.messages.push({
      id: Date.now() + 2,
      content: truncatedContent,
      sender: 'bot',
      timestamp: new Date()
    });

    this.backendSuggestions = res?.suggestions?.length ? res.suggestions : [];
  }

  private handleBotError(error: HttpErrorResponse): void {
    this.removeLoadingMessage();
    this.backendSuggestions = [];
    this.messages.push({
      id: Date.now() + 2,
      content: this.extractErrorMessage(error),
      sender: 'bot',
      timestamp: new Date()
    });
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
      return 'Ban chua duoc cap quyen de su dung chatbot nay. Hay dang nhap lai hoac kiem tra token.';
    }

    return CHATBOT_CONNECTION_ERROR;
  }

  private truncateMessage(message: string): string {
    if (message.length <= this.MAX_MESSAGE_LENGTH) {
      return message;
    }
    const truncated = message.substring(0, this.MAX_MESSAGE_LENGTH);
    const lastNewline = truncated.lastIndexOf('\n');
    const lastBullet = truncated.lastIndexOf('•');
    const cutPoint = Math.max(lastNewline, lastBullet);
    return cutPoint > this.MAX_MESSAGE_LENGTH - 100
      ? truncated.substring(0, cutPoint) + '\n\n... (phan hoi qua dai, vui long xem chi tiet trong trang day du)'
      : truncated + '\n\n... (phan hoi qua dai)';
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
