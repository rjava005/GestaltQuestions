// Payload for messages
// This is what is getting sent to chat
type TextPayload = {
  type: "text";
  text: string;
};
type ImageUrl = {
  url: string;
};

export type ImagePayload = {
  type: "image_url";
  image_url: ImageUrl;
};

export type MessagePayload = TextPayload | ImagePayload;
