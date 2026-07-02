// Allowed things to upload
export type UploadAccept = "images" | "pdf" | "images_pdf" | "any" | "zip";

export const acceptMap: Record<UploadAccept, string> = {
  images: "image/*",
  pdf: "application/pdf",
  images_pdf: "image/*,application/pdf",
  zip: ".zip,application/zip",
  any: "*",
};
