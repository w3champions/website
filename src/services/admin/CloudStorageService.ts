import { API_URL } from "@/config/env";
import type { CloudFile, CloudStorageProvider, CloudValidationMessage } from "@/store/admin/cloudStorage/types";
import { authDownload, authorizedFetch } from "@/helpers/general";

export default class CloudStorageService {
  public static async fetchFiles(token: string, provider: CloudStorageProvider): Promise<CloudFile[]> {
    const url = `${API_URL}api/admin/storage/${provider}`;

    let response: Response;
    try {
      response = await authorizedFetch("GET", url, token);
    } catch {
      throw new Error(`Could not reach the ${provider.toUpperCase()} storage API. Try again later.`);
    }

    if (!response.ok) {
      throw new Error(`Could not load ${provider.toUpperCase()} files (HTTP ${response.status}). The storage API may be unavailable.`);
    }
    return await response.json();
  }

  public static async uploadFile(token: string, file: File, provider: CloudStorageProvider): Promise<CloudValidationMessage> {
    const url = `${API_URL}api/admin/storage/${provider}/upload`;

    const filePromise = new Promise<Response>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        try {
          const content = readerEvent?.target?.result as string;
          const base64content = content?.split("base64,")[1];

          const response = await authorizedFetch(
            "POST",
            url,
            token,
            JSON.stringify({
              name: file.name,
              content: base64content,
              contentType: file.type,
            }),
          );

          resolve(response);
        } catch (err: unknown) {
          const ex = err as Error;
          reject(ex);
        }
      };
      reader.onerror = (error) => {
        const ex = new Error(JSON.stringify(error));
        reject(ex);
      };
      reader.readAsDataURL(file);
    });

    const response = await filePromise;
    const message = await response.json();
    if (response.ok) {
      return { message, isSuccess: true };
    } else {
      return { message, isSuccess: false };
    }
  }

  public static async readFile(token: string, fileName: string, provider: CloudStorageProvider): Promise<File> {
    const response = await authorizedFetch("GET", `${API_URL}api/admin/storage/${provider}/download/${encodeURIComponent(fileName)}`, token);
    if (!response.ok) throw new Error(`Could not load the stored image (HTTP ${response.status}).`);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  }

  public static downloadFile(token: string, fileName: string, provider: CloudStorageProvider): void {
    const url = `${API_URL}api/admin/storage/${provider}/download/${fileName}`;
    authDownload(url, token, fileName);
  }

  public static async deleteFile(token: string, fileName: string, provider: CloudStorageProvider): Promise<CloudValidationMessage> {
    const url = `${API_URL}api/admin/storage/${provider}/${encodeURIComponent(fileName)}`;
    try {
      const response = await authorizedFetch("DELETE", url, token);
      const message = await response.json();
      if (response.ok) {
        return { message, isSuccess: true };
      } else {
        return { message, isSuccess: false };
      }
    } catch (err: unknown) {
      const ex = err as Error;
      return { message: ex.message, isSuccess: false };
    }
  }
}
