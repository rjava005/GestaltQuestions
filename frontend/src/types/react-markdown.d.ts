import "react-markdown/lib/ast-to-react";

declare module "react-markdown/lib/ast-to-react" {
  interface Components {
    "pl-question-panel"?: any;
    "pl-number-input"?: any;
    "pl-solution-panel"?: any;
    "pl-figure"?: any;
  }
}
