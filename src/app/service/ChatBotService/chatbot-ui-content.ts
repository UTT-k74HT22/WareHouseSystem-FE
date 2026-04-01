import { ChatBotIntent } from './chatbot.service';

export const CHATBOT_PANEL_TITLE = 'WHS Assistant';
export const CHATBOT_PANEL_STATUS = 'Dữ liệu thật từ hệ thống';
export const CHATBOT_INPUT_PLACEHOLDER = 'Nhập SKU, tên sản phẩm, mã kho...';

export const CHATBOT_SUGGESTIONS = [
  {
    label: 'Tra cứu sản phẩm',
    query: 'Tìm sản phẩm ',
    intent: ChatBotIntent.PRODUCT_LOOKUP,
    requiresInput: true
  },
  {
    label: 'Danh sách kho',
    query: 'Xem danh sách các kho',
    intent: ChatBotIntent.WAREHOUSE_LOOKUP
  },
  {
    label: 'Batch sắp hết hạn',
    query: 'Liệt kê các batch sắp hết hạn trong 30 ngày',
    intent: ChatBotIntent.BATCH_EXPIRING
  },
  {
    label: 'Hướng dẫn sử dụng',
    query: 'Hướng dẫn sử dụng hệ thống',
    intent: ChatBotIntent.SYSTEM_GUIDE
  }
];

export const CHATBOT_FOLLOWUP_SUGGESTIONS = [
  {
    label: 'Nhập SKU để xem tồn kho',
    query: 'Tồn kho ',
    intent: ChatBotIntent.INVENTORY_SUMMARY,
    requiresInput: true
  },
  {
    label: 'Nhập SKU để tìm sản phẩm',
    query: 'Tìm sản phẩm ',
    intent: ChatBotIntent.PRODUCT_LOOKUP,
    requiresInput: true
  },
  {
    label: 'Danh sách kho',
    query: 'Xem danh sách các kho',
    intent: ChatBotIntent.WAREHOUSE_LOOKUP
  },
  {
    label: 'Hướng dẫn sử dụng',
    query: 'Hướng dẫn sử dụng hệ thống',
    intent: ChatBotIntent.SYSTEM_GUIDE
  }
];

export const CHATBOT_WELCOME_MESSAGE = `Chào bạn!

Tôi là WHS Assistant - trợ lý kho thông minh.
Tôi có thể giúp bạn:
• Tra cứu sản phẩm, tồn kho, vị trí
• Xem thông tin kho bãi, đối tác
• Tra cứu đơn hàng nhập/xuất
• Xem các batch sắp hết hạn
• Hỗ trợ vận hành hệ thống

Ví dụ: "Tìm sản phẩm test", "SKU-001 còn bao nhiêu?", "Danh sách kho", "Hướng dẫn sử dụng hệ thống".`;

export const CHATBOT_INVALID_RESPONSE =
  'Tôi chưa hiểu rõ yêu cầu của bạn. Bạn có thể hỏi lại bằng một trong các gợi ý hoặc thử lại với từ khóa khác.';

export const CHATBOT_CONNECTION_ERROR =
  'Không thể kết nối với hệ thống chatbot. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.';
