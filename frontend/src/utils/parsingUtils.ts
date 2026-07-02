import { type FileData } from "../types/fileTypes";

const IMAGE_EXTENSIONS = new Set([
  "apng",
  "avif",
  "bmp",
  "gif",
  "heic",
  "heif",
  "ico",
  "jfif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "svgz",
  "tif",
  "tiff",
  "webp",
]);

const IMAGE_MIME_PREFIX = "image/";
const BASE64_DATA_URL_RE = /^data:([^;,]+);base64,(.*)$/i;
const BASE64_CHARS_RE = /^[A-Za-z0-9+/=]+$/;

function normalizeBase64(input: string): string {
  return input.replace(/\s+/g, "");
}

function looksLikeBase64(input: string): boolean {
  if (!input) return false;
  return BASE64_CHARS_RE.test(input) && input.length % 4 === 0;
}

function toDataUrl(mime: string, payload: string): string {
  return `data:${mime};base64,${payload}`;
}

function decodeBase64Text(input: string): string | null {
  try {
    return atob(input);
  } catch {
    return null;
  }
}

function maybeDecodeDoubleEncodedBase64(payload: string): string {
  const normalized = normalizeBase64(payload);
  const decoded = decodeBase64Text(normalized);
  if (!decoded) return normalized;

  const decodedNormalized = normalizeBase64(decoded);
  return looksLikeBase64(decodedNormalized) ? decodedNormalized : normalized;
}

function inferImageMimeType(f: FileData): string | null {
  const mime = f.mime_type?.toLowerCase().trim();
  if (mime?.startsWith(IMAGE_MIME_PREFIX)) return mime;

  if (!f.filename) return null;
  const ext = f.filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;

  switch (ext) {
    case "jpg":
    case "jpeg":
    case "jfif":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
    case "svgz":
      return "image/svg+xml";
    case "bmp":
      return "image/bmp";
    case "ico":
      return "image/x-icon";
    case "tif":
    case "tiff":
      return "image/tiff";
    case "avif":
      return "image/avif";
    case "apng":
      return "image/apng";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return null;
  }
}

export function isImageExt(filename: string): boolean {
  const cleanName = filename.split(/[?#]/)[0] ?? "";
  const ext = cleanName.split(".").pop()?.toLowerCase();
  return !!ext && IMAGE_EXTENSIONS.has(ext);
}

export function getImageBase64FileData(f: FileData): string | null {
  if (!f.content) return null;

  const rawContent = f.content.trim();
  if (!rawContent) return null;

  // Already a full image data URL
  if (rawContent.startsWith("data:image/")) return rawContent;

  // Any data URL: only accept image/* MIME
  const dataUrlMatch = rawContent.match(BASE64_DATA_URL_RE);
  if (dataUrlMatch) {
    const mime = dataUrlMatch[1]?.toLowerCase();
    const payload = normalizeBase64(dataUrlMatch[2] ?? "");
    if (!mime?.startsWith(IMAGE_MIME_PREFIX) || !payload) return null;
    return toDataUrl(mime, maybeDecodeDoubleEncodedBase64(payload));
  }

  const mime = inferImageMimeType(f);
  if (!mime) return null;

  const normalizedPayload = normalizeBase64(rawContent);
  const payload = maybeDecodeDoubleEncodedBase64(normalizedPayload);

  if (!looksLikeBase64(payload)) return null;
  return toDataUrl(mime, payload);
}

export const handleCommaSeperatedValues = (val: string) => {
  return val
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};
