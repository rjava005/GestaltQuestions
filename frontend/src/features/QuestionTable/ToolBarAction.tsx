import { BiSelectMultiple } from "react-icons/bi";
import { IoMdDownload } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { IoSettings } from "react-icons/io5";
import { FaSyncAlt } from "react-icons/fa";
import { type IconType } from "react-icons";
import type { QuestionData, QuestionMeta } from "../../types/questionTypes";

export type ToolBarAction =
    | "TOGGLE_MULTI_SELECT"
    | "DOWNLOAD"
    | "DELETE"
    | "SYNC"
    | "TABLE_SETTINGS";

type ToolBarItemBase = {
    label: string;
    action: ToolBarAction;
    icon?: IconType;
    multiSelect?: boolean; // Only trigger if multiselect is activate
};
export type ToolBarDropdownItem<T> = {
    key: keyof T;
    label: string;
    default: boolean;
};

export type ToolBarItem =
    | (ToolBarItemBase & {
        kind: "button";
    })
    | (ToolBarItemBase & {
        kind: "dropdown";
        items: ToolBarDropdownItem<QuestionData | QuestionMeta>[];
    });

export const QuestionTableDropdownItems: ToolBarDropdownItem<
    QuestionData | QuestionMeta
>[] = [
        {
            key: "title",
            label: "Title",
            default: true,
        },
        {
            key: "topics",
            label: "Topics",
            default: true,
        },
        {
            key: "isAdaptive",
            label: "Adaptive",
            default: true,
        },
        {
            key: "ai_generated",
            label: "AI Generated",
            default: false,
        },
        {
            key: "languages",
            label: "Languages",
            default: false,
        },
        {
            key: "qtypes",
            label: "Question Types",
            default: false,
        },
        {
            key: "storage_path",
            label: "Storage Path",
            default: false,
        },
        {
            key: "status",
            label: "Status",
            default: false,
        },
    ];

export const ToolBarItems: ToolBarItem[] = [
    {
        label: "Multi-Select",
        action: "TOGGLE_MULTI_SELECT",
        icon: BiSelectMultiple,
        kind: "button",
    },
    {
        label: "Download",
        action: "DOWNLOAD",
        icon: IoMdDownload,
        multiSelect: true,
        kind: "button",
    },
    {
        label: "Delete Question",
        action: "DELETE",
        icon: MdDelete,
        multiSelect: true,
        kind: "button",
    },
    {
        label: "Sync",
        action: "SYNC",
        icon: FaSyncAlt,
        kind: "button",
    },
    {
        label: "Table Settings",
        action: "TABLE_SETTINGS",
        icon: IoSettings,
        kind: "dropdown",
        items: QuestionTableDropdownItems,
    },
];
