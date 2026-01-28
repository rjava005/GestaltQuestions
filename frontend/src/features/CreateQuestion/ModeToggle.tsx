import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useCreateMode } from "./context";
import type { CreateMode } from "./types";
import { CREATE_MODE_OPTIONS } from "./config";

export default function ModeToggle() {
  const { mode, setMode } = useCreateMode();

  const handleModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newMode: CreateMode | null
  ) => {
    // MUI returns null when clicking the active button
    if (!newMode) return;
    setMode(newMode);
  };

  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleModeChange}
      aria-label="question creation mode"
    >
      {CREATE_MODE_OPTIONS.map(({ value, label, ariaLabel }) => (
        <ToggleButton key={value} value={value} aria-label={ariaLabel}>
          {label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
