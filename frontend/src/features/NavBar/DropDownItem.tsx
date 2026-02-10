import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import type { NavigationItem, Base as NavBase } from "./types";
import type { LinkVariant } from "./styles";
import { linkStyles } from "./styles";

export function HandleLink({
    nav,
    variant = "default",
}: {
    nav: NavBase;
    variant?: LinkVariant;
}) {
    return (
        <Link key={nav.displayName} to={nav.path} className={linkStyles[variant]}>
            {nav.displayName}
        </Link>
    );
}

export default function DropDownNav({ nav }: { nav: NavigationItem }) {
    if (nav.type !== "dropdown") return;
    return (
        <Menu key={nav.displayName} as="div" className="relative">
            <MenuButton className="flex items-center text-lg text-white hover:text-gray-200">
                <span>{nav.displayName}</span>
                <ChevronDownIcon className="ml-1 h-4 w-4" />
            </MenuButton>
            <MenuItems className="absolute left-0 mt-2 w-40 rounded-xl border border-white/20 bg-gray-800 text-white text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                {nav.items.map((child) => (
                    <MenuItem key={nav.displayName}>
                        <HandleLink nav={child} />
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    );
}
