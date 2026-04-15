import { useMutation } from '@tanstack/react-query';
import { chatAPI } from '../../api/chat';
import { uiStore } from '../../stores/uiStore';

export function useSendChatMessage() {
  return useMutation({
    mutationFn: (payload) => chatAPI.sendMessage(payload),
    onError: (error) => {
      uiStore.getState().addToast('Failed to send message', 'error');
      console.error('Chat error:', error);
    },
  });
}
