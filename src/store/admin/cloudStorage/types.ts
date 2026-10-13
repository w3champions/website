export type CloudStorageState = {
  files: CloudFile[];
  validationMessage: CloudValidationMessage;
};

export type CloudFile = {
  name: string;
  size: number;
  sizeBytes?: number | null;
  lastModified: Date;
  previewPath?: string | null;
};

export type CloudValidationMessage = {
  message: string;
  isSuccess: boolean;
};

export enum CloudStorageProvider {
  ALIBABA = "alibaba",
  S3 = "s3",
}
