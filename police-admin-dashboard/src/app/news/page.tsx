"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createNews } from "@/actions/news";
import { useRouter } from "next/navigation";

interface UploadedImage {
  id: string;
  url: string;
  file: File;
}

export default function NewsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];

    const imageUrl = URL.createObjectURL(file);

    setImages([
      ...images,
      {
        id: Math.random().toString(36).substring(2, 9),
        url: imageUrl,
        file,
      },
    ]);

    e.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setImages(images.filter((image) => image.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!title.trim()) {
      toast.error("Введите заголовок новости");
      setIsSubmitting(false);
      return;
    }

    if (!content.trim()) {
      toast.error("Введите содержание новости");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      
      if (images.length > 0) {
        formData.append("image", images[0].file);
      }

      const result = await createNews(formData);

      if (!result.success) {
        toast.error(result.error || "Ошибка при создании новости");
        setIsSubmitting(false);
        return;
      }

      toast.success(result.message || "Новость успешно опубликована");
      
      setTitle("");
      setContent("");
      setImages([]);
      
      router.refresh();
    } catch (error) {
      console.error("Ошибка при создании новости:", error);
      toast.error("Произошла ошибка при создании новости");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            Создание оперативного уведомления
          </CardTitle>
        </CardHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="font-medium">
                Заголовок новости
              </label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите заголовок..."
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="font-medium">
                Содержание новости
              </label>
              <Textarea
                id="content"
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Введите текст новости..."
                className="min-h-[200px] border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <p className="font-medium">Изображения</p>

              <div className="flex flex-wrap gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative w-32 h-32 rounded-md overflow-hidden border border-gray-300"
                  >
                    <img
                      src={image.url}
                      alt="Uploaded"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md"
                    >
                      <X className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                ))}

                <label
                  htmlFor="image-upload"
                  className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Добавить</span>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Публикация...
                </span>
              ) : (
                "Опубликовать новость"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </DashboardLayout>
  );
}
