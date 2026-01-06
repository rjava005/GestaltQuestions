import { type ToggleVariant } from "./types";
import { toggleStyles } from "./config";

type ToggleProps = {
  checked: boolean;
  setToggle: () => void;
  label: string;
  id: string;
  variant?: ToggleVariant;
};

const ToggleField = ({
  checked,
  setToggle,
  label,
  id,
  variant = "base",
}: ToggleProps) => {
  const styles = toggleStyles[variant];

  return (
    <label htmlFor={id} onClick={setToggle} className={styles.container}>
      <input
        type="checkbox"
        id={id}
        name={id}
        checked={checked}
        className={styles.input}
        readOnly
      />
      <span className={styles.label}>{label}</span>
    </label>
  );
};

export default ToggleField;
