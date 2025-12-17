import SectionContainer from "../components/Base/SectionContainer";
import AccountPageHeader from "../features/accountPage/AccountPageHeader";
import AccountProfilePic from "../features/accountPage/AccountProfilePic";
import AccountInformation from "../features/accountPage/AccountInformation";
import AccountOptions from "../features/accountPage/AccountOptions";
import { useAuth } from "../context/AuthContext";

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <SectionContainer
      id="AccountPage"
      className="flex flex-col gap-y-8 py-8 max-w-4xl mx-auto min-h-screen"
    >
      {/* If user is not logged in */}
      {!user && (
        <div className="w-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-center">
          <p className="text-red-600 dark:text-red-400 font-medium text-lg">
            You need to be logged in to view this page.
          </p>
        </div>
      )}



      {/* Actual Account Page */}
      {user && (
        <>
          <AccountPageHeader />
          <div className=" bg-white dark:bg-neutral-900 p-6 ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-baseline">
              <AccountProfilePic src={""} />
              <AccountInformation />
            </div>
            <AccountOptions />
          </div>
        </>
      )}
    </SectionContainer>
  );
}
