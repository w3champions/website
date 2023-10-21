import { API_URL } from "@/main";
import { CloudFile, CloudValidationMessage, CloudStorageProvider } from "@/store/admin/cloudStorage/types";

export default class CloudStorageService {
  public static async fetchFiles(token: string, provider: CloudStorageProvider): Promise<CloudFile[]> {
    const url = `${API_URL}api/admin/storage/${provider}?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const files: CloudFile[] = response.ok ? await response.json() : [];
    return files;
  }

  public static async uploadFile(token: string, file: File, provider: CloudStorageProvider): Promise<CloudValidationMessage> {
    const url = `${API_URL}api/admin/storage/${provider}/upload?authorization=${token}`;

    const filePromise = new Promise<Response>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        try {
          const content = readerEvent?.target?.result as string;
          const base64content = content?.split("base64,")[1];
          const data = { name: file.name, content: base64content };

          const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          });

          resolve(response);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });

    const response = await filePromise;
    const message = await response.json();
    if (response.ok) {
      return { message, isSuccess: true } as CloudValidationMessage;
    } else {
      return { message, isSuccess: false } as CloudValidationMessage;
    }
  }

  public static downloadFile(token: string, fileName: string, provider: CloudStorageProvider): void {
    const url = `${API_URL}api/admin/storage/${provider}/download/${fileName}?authorization=${token}`;
    window.open(url);
  }

  public static async deleteFile(token: string, fileName: string, provider: CloudStorageProvider): Promise<CloudValidationMessage> {
    const url = `${API_URL}api/admin/storage/${provider}/${fileName}?authorization=${token}`;
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const message = await response.json();
      if (response.ok) {
        return { message, isSuccess: true } as CloudValidationMessage;
      } else {
        return { message, isSuccess: false } as CloudValidationMessage;
      }
    } catch (e: unknown) {
      return { message: e, isSuccess: false } as CloudValidationMessage;
    }
  }
}
