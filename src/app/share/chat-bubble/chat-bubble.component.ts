import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatBubbleService } from '../../service/ChatBotService/chat-bubble.service';
import { ChatBotService } from '../../service/ChatBotService/chatbot.service';
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

  readonly suggestions = CHATBOT_SUGGESTIONS;
  readonly panelTitle = CHATBOT_PANEL_TITLE;
  readonly panelStatus = CHATBOT_PANEL_STATUS;
  readonly inputPlaceholder = CHATBOT_INPUT_PLACEHOLDER;

  private shouldScroll = false;
  private destroy$ = new Subject<void>();

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

  sendSuggestion(suggestion: string): void {
    this.newMessage = suggestion;
    this.sendMessage();
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
