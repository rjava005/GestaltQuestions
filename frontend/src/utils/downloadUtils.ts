function base64ToBytes(base64: string): Blob {
  console.log("This is the base64", base64);
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "application/zip" });
  return blob;
}

export function downloadZip(data: string | Blob, header: string | undefined) {
  const filename = extractFilename(header);
  let blob: Blob;
  if (data instanceof Blob) {
    blob = data;
  } else {
    blob = base64ToBytes(data);
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function extractFilename(header: string | undefined) {
  if (!header) return "download.zip";

  const match = header.match(/filename="?([^"]+)"?/);
  return match ? match[1] : "download.zip";
}

export function downloadJson(data: any, filename = "data.json") {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
