import { create } from 'zustand';

// Tracks live-chat state used by the floating FABs and (eventually) the
// chat panel. For now we only model the binary "human agent active"
// flag — the human chat FAB hides itself when no agent is engaged.
// `agentTyping` drives the bouncing-dots animation inside the human
// FAB so the user sees activity even before they open the panel.
interface ChatState {
  isHumanChatActive: boolean;
  agentTyping: boolean;
  // AI typing — pipe in your AI service's "thinking" signal here.
  aiTyping: boolean;
  setHumanChatActive: (active: boolean) => void;
  setAgentTyping: (typing: boolean) => void;
  setAiTyping: (typing: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isHumanChatActive: false,
  agentTyping: false,
  aiTyping: false,
  setHumanChatActive: (active) => set({ isHumanChatActive: active }),
  setAgentTyping: (typing) => set({ agentTyping: typing }),
  setAiTyping: (typing) => set({ aiTyping: typing }),
}));
