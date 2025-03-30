"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, Lock, Key } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { loginUser } from "@/actions/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showTotpField, setShowTotpField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    if (totpCode) {
      formData.append("totp_code", totpCode);
    }

    try {
      const result = await loginUser(formData);

      if (!result.success) {
        if (result.needTOTP) {
          setShowTotpField(true);
          toast.info("Введите код двухфакторной аутентификации");
        } else {
          toast.error(result.error || "Ошибка авторизации");
        }
        setIsLoading(false);
        return;
      }
      
      toast.success("Авторизация успешна");
      
      router.push("/chat");
      router.refresh();
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      toast.error("Ошибка соединения с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Авторизация в системе
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  placeholder="Имя пользователя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            {showTotpField && (
              <div className="space-y-2">
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="totp"
                    placeholder="Код двухфакторной аутентификации"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Вход...
                </span>
              ) : (
                "Войти"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 