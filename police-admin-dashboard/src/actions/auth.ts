"use server";

import { cookies } from "next/headers";

export async function loginUser(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const totpCode = formData.get("totp_code") as string;

  try {
    const response = await fetch("http://34.88.151.210:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        totp_code: totpCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: data.error,
        needTOTP: data.error === "Требуется код двухфакторной аутентификации"
      };
    }

    cookies().set("authToken", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Ошибка авторизации:", error);
    return { success: false, error: "Ошибка соединения с сервером" };
  }
}

export async function logoutUser() {
  cookies().delete("authToken");
  return { success: true };
}

export async function getAuthToken() {
  const token = cookies().get("authToken")?.value;
  return token;
} 