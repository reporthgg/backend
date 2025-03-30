"use client";

import { Incident } from "./IncidentsList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { getAuthToken } from "@/actions/auth";

interface IncidentDetailProps {
  incident: Incident | null;
  onBack?: () => void;
  onReply: (incidentId: string, reply: string) => void;
  onMarkAsRead?: (incidentId: string) => void;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
}

export function IncidentDetail({ incident, onBack, onReply, onMarkAsRead }: IncidentDetailProps) {
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!incident) return;
    
    setMessages([{
      id: "initial",
      content: incident.excerpt,
      sender: incident.sender,
      timestamp: incident.date,
    }]);
  }, [incident?.id]);

  const handleSendReply = () => {
    if (!incident || !reply.trim()) return;

    setIsSending(true);

    onReply(incident.id, reply);
    
    setMessages(prev => [...prev, {
      id: uuidv4(),
      content: reply,
      sender: "Оператор",
      timestamp: new Date(),
    }]);
    
    setReply("");
    setIsSending(false);
  };

  const handleToggleReadStatus = () => {
    if (!incident || !onMarkAsRead) return;
    onMarkAsRead(incident.id);
  };

  if (!incident) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        Выберите обращение для просмотра
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="md:hidden mr-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{incident.subject}</h2>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="font-medium">От: {incident.sender}</span>
              <span className="mx-2">•</span>
              <span>{format(incident.date, "d MMMM yyyy", { locale: ru })}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-wrap gap-2">
            {incident.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  tag === "срочно" && "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
                  tag === "новое" && "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
                  tag === "решено" && "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
                  tag === "авария" && "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800"
                )}
              >
                {tag}
              </Badge>
            ))}
          </div>
          
          {onMarkAsRead && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleToggleReadStatus}
              className={cn(
                "flex items-center gap-1",
                incident.unread 
                  ? "text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                  : "text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
              )}
            >
              {incident.unread ? (
                <>
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Отметить как прочитанное
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Прочитано
                </>
              )}
            </Button>
          )}
        </div>
        
        {(incident.mediaUrls?.length || incident.location) && (
          <div className="mt-4 space-y-4">
            {incident.mediaUrls?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Прикрепленные файлы:</h3>
                <div className="flex flex-wrap gap-2">
                  {incident.mediaUrls.map((url, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={url} 
                          alt={`Прикрепленное изображение ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {incident.location && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Местоположение:</h3>
                <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-md relative overflow-hidden">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0} 
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${incident.location.longitude-0.01}%2C${incident.location.latitude-0.01}%2C${incident.location.longitude+0.01}%2C${incident.location.latitude+0.01}&layer=mapnik&marker=${incident.location.latitude}%2C${incident.location.longitude}`}
                  />
                  <a 
                    href={`https://www.openstreetmap.org/?mlat=${incident.location.latitude}&mlon=${incident.location.longitude}#map=15/${incident.location.latitude}/${incident.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 p-1 rounded-md text-xs flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    Открыть карту
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {loadingMessages ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className="flex justify-between items-baseline">
                <h3 className="font-medium">{message.sender}</h3>
                <span className="text-sm text-gray-500">
                  {format(message.timestamp, "HH:mm", { locale: ru })}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 text-gray-800 dark:text-gray-200">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Введите ответ..."
          className="w-full mb-4 min-h-[100px] border-gray-300"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSendReply}
            disabled={!reply.trim() || isSending}
            className="bg-blue-700 hover:bg-blue-800"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Отправка...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Отправить ответ
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
