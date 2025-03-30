"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Send, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "operator";
  timestamp: Date;
  status: "sent" | "delivered" | "read";
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  online: boolean;
}

interface ChatWindowProps {
  activeUser: User | null;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isConnected: boolean;
}

export function ChatWindow({ activeUser, messages, onSendMessage, isConnected }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && isConnected) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  if (!activeUser) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        Выберите пользователя для начала чата
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar>
              <AvatarImage src={activeUser.avatar} />
              <AvatarFallback className="bg-blue-600 text-white">{activeUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {activeUser.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
            )}
          </div>
          <div>
            <h2 className="font-semibold">{activeUser.name}</h2>
            <p className="text-xs text-gray-500">{activeUser.online ? "Онлайн" : "Не в сети"}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "operator" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === "operator"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              }`}
            >
              <p>{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === "operator"
                    ? "text-blue-200"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {format(message.timestamp, "HH:mm", { locale: ru })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!isConnected && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-2 text-center text-sm flex items-center justify-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Нет соединения с сервером. Отправка сообщений недоступна.
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введите сообщение..."
            disabled={!isConnected}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || !isConnected}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
