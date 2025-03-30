"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Image as ImageIcon, MapPin } from "lucide-react";

export interface Incident {
  id: string;
  sender: string;
  subject: string;
  excerpt: string;
  date: Date;
  unread: boolean;
  tags: string[];
  hasMedia?: boolean;
  hasLocation?: boolean;
}

interface IncidentsListProps {
  incidents: Incident[];
  activeIncidentId: string | null;
  onSelectIncident: (id: string) => void;
}

export function IncidentsList({
  incidents,
  activeIncidentId,
  onSelectIncident,
}: IncidentsListProps) {
  return (
    <div className="h-full border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
      <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <h2 className="font-semibold">Обращения</h2>
        <span className="text-sm text-gray-500">
          {incidents.length} обращений
        </span>
      </div>
      <div className="overflow-auto flex-1">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            onClick={() => onSelectIncident(incident.id)}
            className={cn(
              "p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
              incident.unread && "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500",
              activeIncidentId === incident.id && "bg-gray-100 dark:bg-gray-800"
            )}
          >
            <div className="flex justify-between mb-1">
              <h3 className={cn("font-medium", incident.unread && "font-semibold")}>
                {incident.sender}
              </h3>
              <span className="text-xs text-gray-500">
                {format(incident.date, "dd MMM", { locale: ru })}
              </span>
            </div>
            <p className="text-sm font-medium mb-1 truncate">{incident.subject}</p>
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 truncate max-w-[60%]">
                {incident.excerpt}
              </p>
              <div className="flex gap-1 items-center">
                {incident.hasMedia && (
                  <span className="text-gray-400">
                    <ImageIcon className="h-3 w-3" />
                  </span>
                )}
                {incident.hasLocation && (
                  <span className="text-gray-400">
                    <MapPin className="h-3 w-3" />
                  </span>
                )}
                {incident.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={cn(
                      "text-xs",
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
            </div>
            {incident.unread && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
