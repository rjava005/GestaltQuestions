// Testing
// const questionParams = {
//     params: {
//         speed: 60,
//         time: 2,
//         unitsSpeed: "km/h",
//         unitsTime: "s",
//         intermediate: {
//             conversionFactor: 0.27778,
//             convertedSpeed: 16.667,
//         },
//         arr: [1, 2, { x: 3 }],
//     }

// };

type ArrayMode = "index" | "json" | "join";

type FormatArrayOptions = {
  mode: ArrayMode;
  join: string;
};

export function formatArray(
  arr: (string | number)[],
  prefix: string,
  options: FormatArrayOptions = {
    mode: "index",
    join: ", ",
  }
): string | Record<string, string> {
  switch (options.mode) {
    case "join":
      return arr.join(options.join);

    case "json":
      return JSON.stringify(arr);

    case "index":
    default:
      return arr.reduce<Record<string, string>>((acc, val, i) => {
        acc[`${prefix}.${i}`] = val as string;
        return acc;
      }, {});
  }
}

export function flattenObject(
  obj: unknown,
  prefix: string = "",
  out: Record<any, any> = {}
) {
  // Helper either formats is as prefix.value or return just the value
  const base = (s: any) => (prefix ? `${prefix}.${s}` : s);
  if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      // Use type assertion to access property
      let v = (obj as Record<string, any>)[k];
      const key = base(k);
      //   Handle case where we have nexted object as v
      if (v && typeof v === "object") {
        flattenObject(v, key, out);
      } else {
        out[key] = v;
      }
    }
  }
  return out;
}

export function applyPlaceHoldersTemplate(
  template: string,
  data: unknown,
  prefix: string = ""
): string {
  const flat = flattenObject(data, prefix);

  const lookUp = new Map();
  for (const [key, value] of Object.entries(flat)) {
    const str = value === null ? "" : String(value);
    // Looking for pattern {{}} in question.html. Hard coded
    lookUp.set(`{{${key}}}`, str);
  }
  return template.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
    const lookupKey = `{{${key}}}`;
    return lookUp.get(lookupKey) ?? match;
  });
}
