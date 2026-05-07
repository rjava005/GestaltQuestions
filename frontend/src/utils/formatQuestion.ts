// import { QuestionValue } from "../features/QuestionEngine/instance";
// import { roundToSigFigs } from "./mathHelpers";

// export function checkObject(obj: Object, errorMessage: string) {
//   if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
//     console.log(errorMessage);
//     throw new TypeError(errorMessage);
//   }
// }

// export function replaceParameters(
//   questionParams: QuestionValues,
//   prefix: string,
//   templateStr: string,
//   rounding?: boolean,
//   sigfigs?: number
// ): string {
//   // Make a copy of the original template
//   let updatedTemplate = templateStr;

//   for (const key in questionParams) {
//     const value = questionParams[key];
//     const valueType = typeof value;

//     // Handle differeent cases
//     if (valueType === "object") {
//       if (Array.isArray(value)) {
//         // console.log("Got an array", value);
//       }
//       // console.log("Got an object", key, value);
//     }

//     if (typeof value === "object" && value !== null && !Array.isArray(value)) {
//       console.warn(
//         `Warning: The value for '${key}' in '${prefix}' is an object. Skipping replacement for ${prefix}.${key}`
//       );
//       continue;
//     }

//     const placeholder = `[[${prefix}.${key}]]`;
//     const legacyPlaceholder = `{{${prefix}.${key}}}`;

//     const replacement =
//       rounding && typeof value === "number" && sigfigs
//         ? roundToSigFigs(value, sigfigs)
//         : value;

//     updatedTemplate = updatedTemplate.replaceAll(
//       placeholder,
//       String(replacement)
//     );

//     updatedTemplate = updatedTemplate.replaceAll(
//       legacyPlaceholder,
//       String(replacement)
//     );
//   }

//   return updatedTemplate;
// }

// function formatTemplateWithParams(
//   template: string,
//   params: QuestionParams | {},
//   round = false
// ): string {
//   const requiredKeys = ["params", "correct_answers"] as const;

//   checkObject(
//     params,
//     "Error: The generate function did not return a valid object. 'params' must be a non-null object and not an array."
//   );

//   let templateCopy = template;

//   if (!("params" in params) || !("correct_answers" in params)) {
//     throw new TypeError(
//       "Error: The generate function did not return a valid QuestionParams object."
//     );
//   }

//   for (const key of requiredKeys) {
//     const paramGroup = (params as QuestionParams)[key];

//     checkObject(
//       paramGroup,
//       `Error: The value for '${key}' in 'params' is not a valid object.`
//     );

//     templateCopy = replaceParameters(
//       paramGroup as Record<string, string | number | boolean | null>,
//       key,
//       templateCopy,
//       round,
//       (params as QuestionParams).sigfigs
//     );
//   }

//   return templateCopy;
// }

// export default formatTemplateWithParams;
