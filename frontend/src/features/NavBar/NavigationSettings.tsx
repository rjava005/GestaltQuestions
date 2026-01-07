
// Types
import type { NavigationItem } from "../../types/navbarTypes";

// Pages
import Home from "../../pages/Home";
// import ChatPage from "../ChatUI/ChatPage";
import AccountPage from "../../pages/AccountPage";
import QuestionBuilder from "../QuestionBuilder/page";

// Generators
import TextGenerator from "../../components/CodeGenerators/TextGenerator";
import ImageGenerator from "../../components/CodeGenerators/ImageGenerator";

// import GestaltStudio from "../Gestalt Studio/GestaltStudioPage";
import GestaltStudio from "../GestaltStudio/GestaltStudioPage";
import QuestionPlayGroundPage from "../QuestionPlayGround/page";


export const Navigation: NavigationItem[] = [
    //
    // MAIN ROUTES
    //
    {
        type: "route",
        name: "Home",
        href: "/",
        element: <Home />,
        includeNavBar: true,
        requiresAuth: false,
        allowedRoles: []
    },
    {
        type: "route",
        name: "Home",
        href: "/home",
        element: <Home />,
        includeNavBar: false,
        requiresAuth: false,
        allowedRoles: []
    },


    //
    // GENERATORS DROPDOWN
    //
    {
        type: "dropdown",
        name: "Generators",
        includeNavBar: true,
        requiresAuth: false,
        allowedRoles: [],
        items: [
            {
                name: "Text",
                href: "/generators/text_generator",
                element: <TextGenerator />,
                allowedRoles: []
            },
            {
                name: "Image Upload",
                href: "/generators/image_generator",
                element: <ImageGenerator />,
                allowedRoles: []
            },
        ],
    },

    //
    // CHAT
    //
    // {
    //     type: "route",
    //     name: "Chat",
    //     href: "/chat",
    //     element: <ChatPage />,
    //     includeNavBar: true,
    //     requiresAuth: false,
    //     allowedRoles: []
    // },

    //
    // ACCOUNT PAGE
    //
    {
        type: "route",
        name: "My Account",
        href: "/account",
        element: <AccountPage />,
        includeNavBar: false,   // Hidden from Navbar
        requiresAuth: true,     // Protected route
        allowedRoles: []
    },
    {
        type: "route",
        name: "Lecture Test",
        href: "/lecture",
        element: <GestaltStudio />,
        includeNavBar: true,
        requiresAuth: false,
        allowedRoles: []
    },
    {
        type: "route",
        name: "PlayGround",
        href: "/playground",
        element: <QuestionPlayGroundPage />,
        includeNavBar: true,
        requiresAuth: false,
        allowedRoles: []
    },
    {
        type: "route",
        name: "Question Builder",
        href: "/question_builder",
        element: <QuestionBuilder />,
        includeNavBar: true,
        requiresAuth: false,
        allowedRoles: []
    },

];

