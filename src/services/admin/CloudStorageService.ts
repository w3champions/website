import { API_URL } from "@/main";
import { CloudFile, CloudValidationMessage } from "@/store/admin/cloudStorage/types";

export default class CloudStorageService {
  public static async fetchAlibabaFiles(token: string): Promise<CloudFile[]> {
    const url = `${API_URL}api/admin/storage?authorization=${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const fileNames: CloudFile[] = response.ok ? await response.json() : [];
    return fileNames;
  }

  public static async uploadToAlibaba(token: string, file: File): Promise<CloudValidationMessage> {
    const url = `${API_URL}api/admin/storage/upload?authorization=${token}`;

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
      return { successMessage: message, errorMessage: "" } as CloudValidationMessage;
    } else {
      return { successMessage: "", errorMessage: message } as CloudValidationMessage;
    }
  }

  public static downloadAlibabaFile(token: string, fileName: string): void {
    const url = `${API_URL}api/admin/storage/download/${fileName}?authorization=${token}`;
    try {
      window.open(url);
    } catch (e: unknown) {
      console.error(e);
    }
  }

  public static async deleteAlibabaFile(token: string, fileName: string): Promise<CloudValidationMessage> {
    const url = `${API_URL}api/admin/storage/${fileName}?authorization=${token}`;
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
        return { successMessage: message, errorMessage: "" } as CloudValidationMessage;
      } else {
        return { successMessage: "", errorMessage: message } as CloudValidationMessage;
      }
    } catch (e: any) {
      console.error(e);
      return { successMessage: "", errorMessage: e } as CloudValidationMessage;
    }
  }
}
