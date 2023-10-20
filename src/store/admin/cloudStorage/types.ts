export type CloudStorageState = {
  fileNames: CloudFile[];
  validationMessage: CloudValidationMessage;
};

export type CloudFile = {
    name: string;
    size: number;
    lastModified: Date;
}

export type CloudValidationMessage = {
  successMessage: string;
  errorMessage: string;
}
