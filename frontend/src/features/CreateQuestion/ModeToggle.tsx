import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useCreateMode, type CreateMode } from "./context";

export default function ModeToggle() {
    const { mode, setMode } = useCreateMode()

    const handleModeChange = (
        _: React.MouseEvent<HTMLElement>,
        newMode: CreateMode
    ) => {
        setMode(newMode);
    };

    return (
        <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            aria-label="text alignment"
        >
            <ToggleButton value="blank" aria-label="left aligned">
                Start Blank Template
            </ToggleButton>
            <ToggleButton value="upload" aria-label="left aligned">
                Upload Existing Question
            </ToggleButton>
        </ToggleButtonGroup>
    );
}


