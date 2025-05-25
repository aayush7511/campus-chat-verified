
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { webrtcService } from "@/services/webrtcService";

interface Message {
  id: number;
  text: string;
  sender: 'you' | 'stranger';
  timestamp: Date;
}

interface ChatSectionProps {
  partnerConnected: boolean;
  onSendMessage: (message: string) => void;
}

const ChatSection = ({ partnerConnected, onSendMessage }: ChatSectionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Listen for incoming messages via WebRTC data channel
    webrtcService.onDataChannelMessage((message) => {
      const newMsg: Message = {
        id: Date.now(),
        text: message,
        sender: 'stranger',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMsg]);
    });
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && partnerConnected) {
      const message: Message = {
        id: Date.now(),
        text: newMessage,
        sender: 'you',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  // Reset messages when partner disconnects
  useEffect(() => {
    if (!partnerConnected) {
      setMessages([]);
    }
  }, [partnerConnected]);

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="text-white font-semibold mb-4">Chat</h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center text-sm">
              {partnerConnected ? "Start a conversation!" : "Connect with someone to start chatting"}
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-2 rounded max-w-[80%] ${
                  message.sender === 'you'
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-gray-700 text-white'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={partnerConnected ? "Type a message..." : "Connect to chat"}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            disabled={!partnerConnected}
          />
          <Button
            type="submit"
            size="sm"
            className="px-3"
            disabled={!partnerConnected || !newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatSection;
