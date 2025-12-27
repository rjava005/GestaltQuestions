import { SideBarItem } from "./SideBarItem";

type SideBarProps = {
    options: SideBarItem[];
    selected: string;
    setSelected: (val: string) => void;
};

export default function SideBar({
    options,
    selected,
    setSelected,
}: SideBarProps) {
    return (
        <>
            {options.map((v) => (
                <SideBarItem
                    label={v.label}
                    key={v.key}
                    icon={v.icon}
                    onSelect={() => setSelected(v.key)}
                    selected={v.key === selected}
                />
            ))}
        </>
    );
}
