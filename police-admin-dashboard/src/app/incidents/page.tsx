"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { IncidentsList, Incident } from "@/components/incidents/IncidentsList";
import { IncidentDetail } from "@/components/incidents/IncidentDetail";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { getAuthToken } from "@/actions/auth";
import { toast } from "sonner";
import Image from "next/image";
import { MapPin } from "lucide-react";

type IncidentTag = string;

interface Incident {
  id: string;
  sender_name: string;
  subject: string;
  excerpt: string;
  created_at: string;
  unread: boolean;
  tags: IncidentTag[];
  media_urls?: string[];
  latitude?: number;
  longitude?: number;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          toast.error("Не авторизован");
          return;
        }

        const response = await fetch("http://34.88.151.210:8080/api/incidents", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Ошибка при получении данных");
        }

        const data = await response.json();
        setIncidents(data);
      } catch (error) {
        console.error("Ошибка при загрузке инцидентов:", error);
        toast.error("Не удалось загрузить инциденты");
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const activeIncident = activeIncidentId
    ? incidents.find((incident) => incident.id === activeIncidentId) || null
    : null;

  const handleSelectIncident = (id: string) => {
    // Mark as read
    setIncidents((prevIncidents) =>
      prevIncidents.map((incident) =>
        incident.id === id ? { ...incident, unread: false } : incident
      )
    );
    setActiveIncidentId(id);
    setShowMobileDetail(true);
  };

  const handleReply = async (incidentId: string, reply: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error("Не авторизован");
        return;
      }

      // Отправка ответа на сервер
      const response = await fetch(`http://34.88.151.210:8080/api/incidents/${incidentId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: reply })
      });

      if (!response.ok) {
        throw new Error("Ошибка при отправке ответа");
      }

      // Обновляем статус инцидента
      setIncidents((prevIncidents) =>
        prevIncidents.map((incident) => {
          if (incident.id === incidentId) {
            // Обновляем теги
            const updatedTags = incident.tags.includes("решено")
              ? incident.tags
              : [...incident.tags.filter(tag => tag !== "новое"), "решено"];

            return {
              ...incident,
              tags: updatedTags,
              unread: false
            };
          }
          return incident;
        })
      );

      toast.success("Ответ отправлен");
    } catch (error) {
      console.error("Ошибка при отправке ответа:", error);
      toast.error("Не удалось отправить ответ");
    }
  };

  const handleBackToList = () => {
    setShowMobileDetail(false);
  };

  const handleToggleReadStatus = async (incidentId: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error("Не авторизован");
        return;
      }

      const currentIncident = incidents.find(inc => inc.id === incidentId);
      if (!currentIncident) return;

      if (!currentIncident.unread) {
        setIncidents((prevIncidents) =>
          prevIncidents.map((incident) =>
            incident.id === incidentId ? { ...incident, unread: true } : incident
          )
        );
        toast.success("Инцидент отмечен как непрочитанный");
        return;
      }

      const response = await fetch(`http://34.88.151.210:8080/api/incidents/${incidentId}/read`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Ошибка при отметке инцидента как прочитанного");
      }

      setIncidents((prevIncidents) =>
        prevIncidents.map((incident) =>
          incident.id === incidentId ? { ...incident, unread: false } : incident
        )
      );

      toast.success("Инцидент отмечен как прочитанный");
    } catch (error) {
      console.error("Ошибка при изменении статуса инцидента:", error);
      toast.error("Не удалось изменить статус инцидента");
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="h-full grid md:grid-cols-[350px_1fr] grid-cols-1">
            <div className={`${showMobileDetail ? "hidden md:block" : "block"}`}>
              <IncidentsList
                incidents={incidents.map(incident => ({
                  id: incident.id,
                  sender: incident.sender_name,
                  subject: incident.subject,
                  excerpt: incident.excerpt,
                  date: new Date(incident.created_at),
                  unread: incident.unread,
                  tags: incident.tags,
                  hasMedia: !!incident.media_urls?.length,
                  hasLocation: !!incident.latitude && !!incident.longitude
                }))}
                activeIncidentId={activeIncidentId}
                onSelectIncident={handleSelectIncident}
              />
            </div>
            <div className={`${!showMobileDetail ? "hidden md:block" : "block"}`}>
              <IncidentDetail
                incident={activeIncident ? {
                  id: activeIncident.id,
                  sender: activeIncident.sender_name,
                  subject: activeIncident.subject,
                  excerpt: activeIncident.excerpt,
                  date: new Date(activeIncident.created_at),
                  unread: activeIncident.unread,
                  tags: activeIncident.tags,
                  mediaUrls: activeIncident.media_urls?.map(url => `http://34.88.151.210:8080${url}`),
                  location: activeIncident.latitude && activeIncident.longitude ? {
                    latitude: activeIncident.latitude,
                    longitude: activeIncident.longitude
                  } : undefined
                } : null}
                onReply={handleReply}
                onBack={handleBackToList}
                onMarkAsRead={handleToggleReadStatus}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
