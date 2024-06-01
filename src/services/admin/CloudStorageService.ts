import { API_URL } from "@/main";
import { CloudFile, CloudValidationMessage, CloudStorageProvider } from "@/store/admin/cloudStorage/types";
import { authorizedFetch, authDownload } from "@/helpers/general";

export default class CloudStorageService {
  public static async fetchFiles(token: string, provider: CloudStorageProvider): Promise<CloudFile[]> {
    const url = `${API_URL}api/admin/storage/${provider}?authorization=${token}`;

    const response = await authorizedFetch("GET", url, token);

    return response.ok ? await response.json() : [];
  }

  public static async uploadFile(token: string, file: File, provider: CloudStorageProvider): Promise<CloudValidationMessage> {
    const url = `${API_URL}api/admin/storage/${provider}/upload?authorization=${token}`;

    const filePromise = new Promise<Response>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        try {
          const content = readerEvent?.target?.result as string;
          const base64content = content?.split("base64,")[1];

          const response = await authorizedFetch("POST", url, token, JSON.stringify({
            name: file.name,
            content: base64content
          }));

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
    authDownload(url, token, fileName);
  }

  public static async deleteFile(token: string, fileName: string, provider: CloudStorageProvider): Promise<CloudValidationMessage> {
    const url = `${API_URL}api/admin/storage/${provider}/${fileName}?authorization=${token}`;
    try {
      const response = await authorizedFetch("DELETE", url, token);
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
