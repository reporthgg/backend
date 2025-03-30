"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserList } from "@/components/chat/UserList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

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
  lastMessage: string;
  lastMessageTime: Date;
  online: boolean;
  unread: number;
}

const mockUsers: User[] = [
  {
    id: "84157d73-c387-4e05-836c-b7c899e58453",
    name: "Диас Диасов",
    lastMessage: "Добрый день, подскажите пожалуйста...",
    lastMessageTime: new Date("2025-03-30T13:45:00"),
    online: true,
    unread: 2,
  },
  {
    id: "2",
    name: "Амир Амиров",
    lastMessage: "Спасибо за информацию",
    lastMessageTime: new Date("2025-03-30T12:30:00"),
    online: true,
    unread: 0,
  },
  {
    id: "3",
    name: "Дмитрий Дмитрий",
    lastMessage: "Когда будет рассмотрено моё заявление?",
    lastMessageTime: new Date("2025-03-29T18:12:00"),
    online: false,
    unread: 0,
  },
  {
    id: "4",
    name: "Надир Надиров",
    lastMessage: "Я отправил все документы",
    lastMessageTime: new Date("2025-03-29T16:05:00"),
    online: false,
    unread: 1,
  },
  {
    id: "5",
    name: "Арнур Арнуров",
    lastMessage: "Где я могу получить справку?",
    lastMessageTime: new Date("2025-03-28T14:22:00"),
    online: false,
    unread: 0,
  },
];

interface MessageMap {
  [key: string]: Message[];
}

const mockMessages: MessageMap = {
  "84157d73-c387-4e05-836c-b7c899e58453": [
    {
      id: "msg1",
      content: "Добрый день, подскажите пожалуйста, как подать заявление о краже?",
      sender: "user",
      timestamp: new Date("2025-03-30T13:40:00"),
      status: "read",
    },
    {
      id: "msg2",
      content: "Здравствуйте! Вы можете подать заявление онлайн через портал Госуслуги или лично посетить ближайший отдел полиции.",
      sender: "operator",
      timestamp: new Date("2025-03-30T13:42:00"),
      status: "read",
    },
    {
      id: "msg3",
      content: "Какие документы нужны для подачи заявления?",
      sender: "user",
      timestamp: new Date("2025-03-30T13:44:00"),
      status: "read",
    },
    {
      id: "msg4",
      content: "Для подачи заявления вам понадобится удостоверение личности. Также желательно иметь документы на украденное имущество, если они есть.",
      sender: "operator",
      timestamp: new Date("2025-03-30T13:45:00"),
      status: "read",
    },
  ],
  "2": [
    {
      id: "msg1",
      content: "Здравствуйте, как мне получить справку о несудимости?",
      sender: "user",
      timestamp: new Date("2025-03-30T12:25:00"),
      status: "read",
    },
    {
      id: "msg2",
      content: "Добрый день! Справку о несудимости можно заказать через портал ЕГОВ.",
      sender: "operator",
      timestamp: new Date("2025-03-30T12:28:00"),
      status: "read",
    },
    {
      id: "msg3",
      content: "Спасибо за информацию",
      sender: "user",
      timestamp: new Date("2025-03-30T12:30:00"),
      status: "read",
    },
  ],
  "3": [
    {
      id: "msg1",
      content: "Я подал заявление о пропаже документов неделю назад. Когда будет рассмотрено моё заявление?",
      sender: "user",
      timestamp: new Date("2025-03-29T18:12:00"),
      status: "read",
    },
  ],
  "4": [
    {
      id: "msg1",
      content: "Добрый день, мне нужна справка для страховой компании о ДТП",
      sender: "user",
      timestamp: new Date("2025-03-29T16:00:00"),
      status: "read",
    },
    {
      id: "msg2",
      content: "Здравствуйте. Для получения справки вам необходимо предоставить документы. Вы можете подойти в отдел ЦОН",
      sender: "operator",
      timestamp: new Date("2025-03-29T16:03:00"),
      status: "read",
    },
    {
      id: "msg3",
      content: "Я отправил все документы",
      sender: "user",
      timestamp: new Date("2025-03-29T16:05:00"),
      status: "delivered",
    },
  ],
  "5": [
    {
      id: "msg1",
      content: "Где я могу получить справку о регистрации машины?",
      sender: "user",
      timestamp: new Date("2025-03-28T14:22:00"),
      status: "read",
    },
  ],
};


const POLICE_OPERATOR_ID = "203f9207-4541-4e81-9d01-76d3f1ba3d0e";

export default function ChatPage() {
  const [activeUserId, setActiveUserId] = useState<string | null>("84157d73-c387-4e05-836c-b7c899e58453");
  const [users, setUsers] = useState(mockUsers);
  const [messages, setMessages] = useState<MessageMap>(mockMessages);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPageMounted, setIsPageMounted] = useState(false);

  
  useEffect(() => {
    setIsPageMounted(true);
    return () => setIsPageMounted(false);
  }, []);


  const connectWebSocket = () => {
    
    if (!isPageMounted) return;


    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
   
      const socket = new WebSocket(`ws://34.88.151.210:8080/ws/chat?user_id=${POLICE_OPERATOR_ID}&role=police`);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isPageMounted) {
          setIsConnected(true);
          toast.success("Соединение с сервером установлено");
          

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        }
      };

      socket.onmessage = (event) => {
        if (!isPageMounted) return;

        try {
          const data = JSON.parse(event.data);
          
    
          const newMessage = {
            id: uuidv4(),
            content: data.message,
            sender: "user",
            timestamp: new Date(),
            status: "delivered",
          };

 
          setMessages((prevMessages) => {
            const senderId = data.sender_id;
            return {
              ...prevMessages,
              [senderId]: [...(prevMessages[senderId] || []), newMessage],
            };
          });

     
          setUsers((prevUsers) => {
            const userIndex = prevUsers.findIndex(user => user.id === data.sender_id);
            
            if (userIndex !== -1) {
             
              const updatedUsers = [...prevUsers];
              updatedUsers[userIndex] = {
                ...updatedUsers[userIndex],
                lastMessage: data.message,
                lastMessageTime: new Date(),
                unread: activeUserId === data.sender_id ? 0 : updatedUsers[userIndex].unread + 1,
                online: true,
              };
              return updatedUsers;
            } else {
         
              return [
                ...prevUsers,
                {
                  id: data.sender_id,
                  name: `Пользователь ${data.sender_id.substring(0, 8)}`,
                  lastMessage: data.message,
                  lastMessageTime: new Date(),
                  online: true,
                  unread: 1,
                },
              ];
            }
          });


          if (activeUserId === data.sender_id) {
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.id === data.sender_id ? { ...user, unread: 0 } : user
              )
            );
          }
        } catch (error) {
          console.error("Ошибка при обработке сообщения:", error);
        }
      };

      socket.onclose = (event) => {
        if (isPageMounted) {
          setIsConnected(false);
          toast.error("Соединение с сервером разорвано");
          
       
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isPageMounted) {
              toast.info("Попытка переподключения...");
              connectWebSocket();
            }
          }, 5000);
        }
      };

      socket.onerror = (error) => {
        if (isPageMounted) {
          console.error("Ошибка WebSocket:", error);
          toast.error("Ошибка соединения с сервером");
        }
      };
    } catch (error) {
      console.error("Ошибка при создании WebSocket:", error);
      if (isPageMounted) {
        toast.error("Не удалось подключиться к серверу");
      }
    }
  };


  useEffect(() => {
    if (isPageMounted) {
      connectWebSocket();
    }

   
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isPageMounted]);

  const activeUser = activeUserId
    ? users.find((user) => user.id === activeUserId) || null
    : null;

  const handleSelectUser = (userId: string) => {

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, unread: 0 } : user
      )
    );
    setActiveUserId(userId);
  };

  const handleSendMessage = (content: string) => {
    if (!activeUserId || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast.error("Нет соединения с сервером");
      return;
    }

 
    socketRef.current.send(JSON.stringify({
      recipient_id: activeUserId,
      message: content
    }));

   
    const newMessage = {
      id: uuidv4(),
      content,
      sender: "operator",
      timestamp: new Date(),
      status: "sent",
    };

    setMessages((prevMessages) => ({
      ...prevMessages,
      [activeUserId]: [...(prevMessages[activeUserId] || []), newMessage],
    }));

   
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === activeUserId
          ? {
              ...user,
              lastMessage: content,
              lastMessageTime: new Date(),
            }
          : user
      )
    );
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden grid grid-cols-[300px_1fr]">
        <UserList
          users={users}
          activeUserId={activeUserId}
          onSelectUser={handleSelectUser}
          isConnected={isConnected}
        />
        <ChatWindow
          activeUser={activeUser}
          messages={activeUserId ? messages[activeUserId] || [] : []}
          onSendMessage={handleSendMessage}
          isConnected={isConnected}
        />
      </div>
    </DashboardLayout>
  );
}
