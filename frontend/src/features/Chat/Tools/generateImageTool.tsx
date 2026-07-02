import type { ToolMessage } from "langchain";
import { useEffect, useState } from "react";

import { Container } from "../../../components/Container";
import type { RenderPreviewProps, UnknownRecord } from "../instance/types";
import { blobURLtoBase64 } from "../utils/imageUtils";
import { extractToolPayload } from "../utils/parsingUtils";
type ImageResponse = {
  url: string;
};

export function parseImage(msg: ToolMessage): ImageResponse {
  const payload = extractToolPayload(msg);
  if (!payload || typeof payload !== "object")
    throw new Error("Invalid tool payload for generate_image");
  const obj = payload as UnknownRecord;

  const url =
    "url" in obj && obj.url && typeof obj.url === "string" ? obj.url : "";

  return {
    url: url,
  };
}
export function RenderImage({ payload }: RenderPreviewProps<ImageResponse>) {
  const [image, setImage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const resolveImage = async () => {
      const raw = payload.url?.trim() ?? "";
      if (!raw) {
        if (isMounted) setImage("");
        return;
      }

      if (raw.startsWith("data:")) {
        if (isMounted) setImage(raw);
        return;
      }

      if (raw.startsWith("blob:")) {
        const b64 = await blobURLtoBase64(raw);
        if (isMounted) setImage(b64);
        return;
      }

      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        if (isMounted) setImage(raw);
        return;
      }

      if (isMounted) setImage(`data:image/png;base64,${raw}`);
    };

    void resolveImage();

    return () => {
      isMounted = false;
    };
  }, [payload.url]);

  return (
    <Container className="flex justify-center">
      image
      {image ? (
        <img
          src={image}
          alt="Generated image"
          className="block w-full max-w-lg rounded-xl object-contain border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
        />
      ) : null}
    </Container>
  );
}
