"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Wifi, WifiOff } from "lucide-react";

interface User {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  online: boolean;
  unread: number;
}

interface UserListProps {
  users: User[];
  activeUserId: string | null;
  onSelectUser: (userId: string) => void;
  isConnected: boolean;
}

export function UserList({ users, activeUserId, onSelectUser, isConnected }: UserListProps) {
  return (
    <div className="h-full border-r border-gray-200 dark:border-gray-800">
      <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
        <h2 className="font-semibold">Пользователи</h2>
        <div className="flex items-center">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="ml-2 text-xs text-gray-500">
            {isConnected ? "Подключено" : "Отключено"}
          </span>
        </div>
      </div>
      <div className="overflow-auto h-[calc(100%-3.5rem)]">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-800",
              activeUserId === user.id && "bg-gray-100 dark:bg-gray-800"
            )}
          >
            <div className="relative">
              <Avatar>
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {user.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
              )}
              {!user.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <p className="font-medium truncate">{user.name}</p>
                <span className="text-xs text-gray-500">
                  {format(user.lastMessageTime, 'HH:mm', { locale: ru })}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">{user.lastMessage}</p>
            </div>
            {user.unread > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {user.unread}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
