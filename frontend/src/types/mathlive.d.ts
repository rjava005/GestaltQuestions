/* eslint-disable no-undef, no-unused-vars */

import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "aria-label"?: string;
        disabled?: boolean;
      };
    }
  }
}
