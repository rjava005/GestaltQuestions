import { Pill, type PillTheme } from "../../components/Base/Pill";
interface FormatMetaDataProps {
  val: string[] | string;
  label: string;
  theme?: PillTheme;
}

export const FormatMetaData = ({
  val,
  label,
  theme = "primary",
}: FormatMetaDataProps) => {
  const values = Array.isArray(val) ? val : [val];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
        {label}:
      </span>
      {values.map((v, i) => (
        <Pill key={i} theme={theme}>
          {v}
        </Pill>
      ))}
    </div>
  );
};



interface GenericInfoProps {
  title: string;
  data?: string[];
  theme?: PillTheme;
}

export const GenericInfo = ({
  title,
  data = [],
  theme = "secondary",
}: GenericInfoProps) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:gap-x-4 gap-y-2">
    <p className="sm:min-w-[140px] text-base font-semibold text-gray-800 dark:text-gray-200">
      {title}:
    </p>
    <div className="flex flex-wrap gap-2">
      {data.length > 0 ? (
        data.map((val, id) => (
          <Pill key={id} theme={theme}>
            {val}
          </Pill>
        ))
      ) : (
        <span className="text-sm italic text-gray-500 dark:text-gray-400">
          No data
        </span>
      )}
    </div>
  </div>
);