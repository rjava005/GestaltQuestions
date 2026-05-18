import { type ContentBlock } from "langchain";
import { type ReactNode } from "react";

type ImageUrl = {
    url: string;
};

type MessagePayload =
    | {
        type: "text";
        text: string;
    }
    | {
        type: "image_url";
        image_url: ImageUrl;
    };

type ChildChunk = ContentBlock | MessagePayload | string;

function isMessagePayload(x: unknown): x is MessagePayload {
    return (
        typeof x === "object" &&
        x !== null &&
        "type" in x &&
        ("text" in x || "image_url" in x)
    );
}

function isMessagePaylodArray(x: unknown): x is MessagePayload[] {
    return Array.isArray(x) && x.every(isMessagePayload);
}
function isContentBlock(x: unknown): x is ContentBlock {
    return typeof x === "object" && x !== null && "type" in x && "text" in x;
}

function isContentBlockArray(x: unknown): x is ContentBlock[] {
    return Array.isArray(x) && x.every(isContentBlock);
}

function isMixedChunkArray(x: unknown): x is ChildChunk[] {
    return Array.isArray(x) && x.every((item) => typeof item === "string" || isContentBlock(item) || isMessagePayload(item));
}

export function cleanChildren(
    cd: ContentBlock[] | string | MessagePayload[] | ChildChunk[]
): string | ReactNode[] {

    if (typeof cd === "string") {
        return cd;
    }

    else if (isContentBlockArray(cd)) {
        if (!cd.length) return "";
        const last = cd.at(-1);

        if (last?.type === "image_generation_call") {
            return "image generated";
        }

        if (!last || typeof last.text !== "string") {
            return "";
        }

        return last.text;
    }

    else if (isMessagePaylodArray(cd)) {
        return cd.map((v, i) => {
            if (v.type === "text") {
                return (
                    <div className="" key={i}>
                        {v.text}
                    </div>
                );
            }

            if (v.type === "image_url") {
                return (
                    <img
                        key={i}
                        src={v.image_url.url}
                        alt="message"
                        className="max-w-2/5 rounded-md"
                    />
                );
            }

            return null;
        });
    }

    else if (isMixedChunkArray(cd)) {
        const hasImage = cd.some(
            (item) =>
                typeof item !== "string" &&
                "type" in item &&
                item.type === "image_url"
        );

        if (!hasImage) {
            return cd
                .map((item) => {
                    if (typeof item === "string") return item;
                    if ("type" in item && item.type === "text" && typeof item.text === "string") return item.text;
                    if ("type" in item && item.type === "image_generation_call") return "image generated";
                    return "";
                })
                .join("");
        }

        return cd.map((item, i) => {
            if (typeof item === "string") return <div key={i}>{item}</div>;
            if ("type" in item && item.type === "text" && typeof item.text === "string") return <div key={i}>{item.text}</div>;
            if ("type" in item && item.type === "image_url" && "image_url" in item) {
                return (
                    <img
                        key={i}
                        src={((item as unknown) as { image_url: ImageUrl }).image_url.url}
                        alt="message"
                        className="max-w-2/5 rounded-md"
                    />
                );
            }
            return null;
        });
    }
    console.log("Cannot determine type for ", cd)

    return "";
}
