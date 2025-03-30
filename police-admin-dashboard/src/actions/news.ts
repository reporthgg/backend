"use server";

import { getAuthToken } from "./auth";
import { revalidatePath } from "next/cache";

export async function createNews(formData: FormData) {
  const token = await getAuthToken();
  
  if (!token) {
    return { success: false, error: "Не авторизован" };
  }

  try {
    const serverFormData = new FormData();
    serverFormData.append("title", formData.get("title") as string);
    serverFormData.append("content", formData.get("content") as string);
    
    const imageFile = formData.get("image") as File;
    if (imageFile && imageFile.size > 0) {
      serverFormData.append("image", imageFile);
    }

    const response = await fetch("http://34.88.151.210:8080/api/news", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: serverFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Ошибка создания новости" };
    }

    revalidatePath("/news");
    
    return { 
      success: true, 
      message: "Новость успешно создана",
      data
    };
  } catch (error) {
    console.error("Ошибка создания новости:", error);
    return { success: false, error: "Ошибка соединения с сервером" };
  }
} 