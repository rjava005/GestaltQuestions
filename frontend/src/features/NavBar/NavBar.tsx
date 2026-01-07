import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";

import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

import { useState } from "react";
import { BrowserRouter as Router, Routes, Link } from "react-router-dom";

import { Navigation } from "./config";
import AuthenticationPage from "../../pages/AuthenticationPage";
import { useAuth } from "../../context/AuthContext";

import { canAccessRoute } from "./utils";
import DropDownNav from "./DropDownItem";
import { HandleLink } from "./DropDownItem";
import { handleRoutes } from "./utils";

function NavBar() {
  const [showLogin, setShowLogin] = useState(false);
  const { user, logout, userData } = useAuth();

  const accountNav = Navigation.find((v) => v.displayName === "My Account");

  return (
    <Router>
      <Disclosure as="nav" className="bg-gray-800">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            {/* Mobile Hamburger */}
            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
              <DisclosureButton className="group inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white">
                <Bars3Icon className="block h-6 w-6 group-data-open:hidden" />
                <XMarkIcon className="hidden h-6 w-6 group-data-open:block" />
              </DisclosureButton>
            </div>

            {/* Desktop Navigation */}
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div className="hidden sm:block sm:ml-6">
                <div className="flex items-center space-x-4">
                  {/* Start the mapping of the navigation items */}

                  {Navigation.map(
                    (nav) =>
                      nav.includeNavBar &&
                      canAccessRoute(nav, user, userData?.role ?? "student") &&
                      (nav.type === "dropdown" ? (
                        <DropDownNav key={nav.displayName} nav={nav} />
                      ) : (
                        <HandleLink nav={nav} />
                      ))
                  )}
                </div>
              </div>

              {/* Right-side buttons */}
              <div className="ml-auto flex items-center text-white space-x-4">
                {user ? (
                  <>
                    <button
                      onClick={logout}
                      className="px-4 py-2 font-semibold transition transform hover:scale-105 active:scale-95"
                    >
                      Logout
                    </button>

                    {accountNav && (
                      <Link
                        to={accountNav.type === "route" ? accountNav.path : ""}
                        className="px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        {accountNav.displayName}
                      </Link>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => setShowLogin((prev) => !prev)}
                    className="px-4 py-2 font-semibold transition transform hover:scale-105 active:scale-95"
                  >
                    Sign Up / Log In
                  </button>
                )}

                {showLogin && (
                  <AuthenticationPage
                    show={showLogin}
                    setShow={() => setShowLogin((prev) => !prev)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <DisclosurePanel className="sm:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {Navigation.map(
              (item) =>
                item.type === "route" &&
                item.includeNavBar && (
                  <DisclosureButton
                    key={item.displayName}
                    as={Link}
                    to={item.path}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    {item.displayName}
                  </DisclosureButton>
                )
            )}
          </div>
        </DisclosurePanel>
      </Disclosure>

      {/* Render Routes */}
      <Routes>{handleRoutes(Navigation)}</Routes>
    </Router>
  );
}

export default NavBar;
