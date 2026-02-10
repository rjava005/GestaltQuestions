import clsx from "clsx";
import Button from "./Button";
import type { IconType } from "react-icons";



type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconType;
  label: string;
  onClick?: () => void;
  className?: string;
};
export default function ActionButton({
  icon: Icon,
  label,
  onClick,
  className,
  ...rest
}: ActionButtonProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "w-full flex justify-center border p-2 rounded-md shadow hover:scale-105 uration-300 ease-in-out",
        className,
        rest.disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:scale-105",
      )}
    >
      <Button {...rest} icon={Icon} name={label} size={"sm"} className="flex flex-row gap-2 items-center justify-between" color={"transparent"} />
    </div>
  );
}
