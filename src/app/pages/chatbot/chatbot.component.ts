import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChatBotService,
  ChatBotIntent,
  ChatBotSuggestion,
  ChatBotResponse
} from '../../service/ChatBotService/chatbot.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import {
  CHATBOT_CONNECTION_ERROR,
  CHATBOT_INPUT_PLACEHOLDER,
  CHATBOT_INVALID_RESPONSE,
  CHATBOT_PANEL_STATUS,
  CHATBOT_PANEL_TITLE,
  CHATBOT_SUGGESTIONS, // Keep for initial welcome state if needed, but will be overridden by BE suggestions
  CHATBOT_FOLLOWUP_SUGGESTIONS, // Keep for initial welcome state if needed, but will be overridden by BE suggestions
  CHATBOT_WELCOME_MESSAGE
} from '../../service/ChatBotService/chatbot-ui-content';

export interface Message {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

// Align Frontend Suggestion interface with Backend's ChatBotSuggestion
export interface Suggestion {
  label: string;
  intent: ChatBotIntent;
  sku?: string;
  query?: string;
  requiresInput?: boolean;
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
  // lastSearchedSku and lastSearchedName are likely no longer needed as backend will provide structured data
  // lastSearchedSku: string | null = null;
  // lastSearchedName: string | null = null;

  // These hardcoded suggestions will be replaced by backend suggestions for follow-ups
  readonly initialSuggestions: Suggestion[] = CHATBOT_SUGGESTIONS; // For welcome state
  readonly followupSuggestions: Suggestion[] = CHATBOT_FOLLOWUP_SUGGESTIONS; // For general follow-ups if BE doesn't provide any
  readonly panelTitle = CHATBOT_PANEL_TITLE;
  readonly panelStatus = CHATBOT_PANEL_STATUS;
  readonly inputPlaceholder = CHATBOT_INPUT_PLACEHOLDER;

  private backendSuggestions: ChatBotSuggestion[] = []; // Store suggestions from backend

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
      // For the welcome message, we might show initial suggestions or specific ones if backend provides them
      // For now, stick to initial suggestions as per original logic, but backend can override this
      return this.initialSuggestions;
    } else if (this.backendSuggestions.length > 0) {
      // Use backend suggestions if available
      return this.backendSuggestions.map((suggestion) => this.normalizeSuggestion(suggestion));
    } else {
      // Fallback to hardcoded follow-up suggestions if backend provides none
      return this.followupSuggestions;
    }
  }

  private shouldScroll = false;
  private readonly MAX_MESSAGE_LENGTH = 500;

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

    // If sending a suggestion, use the structured request
    // For now, only send message if it's a new input from user
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
    this.backendSuggestions = []; // Clear backend suggestions
    this.addWelcomeMessage();
    this.shouldScroll = true;
  }

  sendSuggestion(suggestion: Suggestion): void {
    if (suggestion.requiresInput) {
      this.newMessage = suggestion.query ?? '';
      return;
    }

    // When a suggestion is clicked, send it as a structured request to the backend
    // Clear backend suggestions after selection to avoid showing them again immediately
    this.backendSuggestions = [];
    this.shouldScroll = true;

    this.messages.push({
      id: Date.now(),
      content: suggestion.label, // Display the suggestion label as user's message
      sender: 'user',
      timestamp: new Date()
    });

    // Add a loading message for the bot's response
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

    // Send structured request: include intent, and a message fallback when no sku is available.
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

    // Update backend suggestions if provided
    if (res?.suggestions && res.suggestions.length > 0) {
      this.backendSuggestions = res.suggestions;
    } else {
      this.backendSuggestions = []; // Clear if none are provided
    }

    // This part might need adjustment if backend provides product info differently
    // If backend replies with product info, it might be in the 'reply' string or a new field in ChatBotResponse
    // For now, assuming it's still in the string for backward compatibility or if backend doesn't change response format.
    // If backend changes response to include product in response object, this needs update.
    // this.extractProductInfo(truncatedContent); // This might be obsolete if backend sends structured data
  }

  private handleBotError(error: HttpErrorResponse): void {
    this.removeLoadingMessage();
    this.messages.push({
      id: Date.now() + 2,
      content: this.extractErrorMessage(error),
      sender: 'bot',
      timestamp: new Date()
    });
    this.toastr.error('Chatbot trả về lỗi');
  }

  // This method is likely obsolete now, as suggestions are handled directly and backend provides structured data.
  // private buildContextMessage(query: string): string {
  //   // This logic was to pre-pend SKU to user's text query.
  //   // Now, we send structured intent and payload directly.
  //   return query; // Placeholder, might be removed or refactored
  // }

  // This might be obsolete if backend response structure changes or if we solely rely on suggestions.
  // private extractProductInfo(reply: string): void {
  //   const skuMatch = reply.match(/`([^`]+)`/);
  //   if (skuMatch) {
  //     this.lastSearchedSku = skuMatch[1];
  //     return;
  //   }
  //   const nameMatch = reply.match(/\*\*([^*]+)\*\*/);
  //   if (nameMatch) {
  //     this.lastSearchedName = nameMatch[1];
  //   }
  // }

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

  private truncateMessage(message: string): string {
    if (message.length <= this.MAX_MESSAGE_LENGTH) {
      return message;
    }
    const truncated = message.substring(0, this.MAX_MESSAGE_LENGTH);
    const lastNewline = truncated.lastIndexOf('\n');
    const lastBullet = truncated.lastIndexOf('•');
    const cutPoint = Math.max(lastNewline, lastBullet);
    return cutPoint > this.MAX_MESSAGE_LENGTH - 100
      ? truncated.substring(0, cutPoint) + '\n\n... (phản hồi quá dài, vui lòng xem chi tiết trong trang đầy đủ)'
      : truncated + '\n\n... (phản hồi quá dài)';
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
