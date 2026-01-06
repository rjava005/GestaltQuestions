import { UseAuthMode, type UserMode } from "../context/AuthMode";
import { Section } from "../components/Section";
import { Modal } from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { Header } from "../components/Header";
import VerifyAccount from "../features/UserForm/VerifyAccount";
import { LogInForm, SignUpForm } from "../features/UserForm";

// Handles wether the page is show
type AuthenticationPageModel = {
  show: boolean;
  setShow: () => void;
};

export default function AuthenticationPage({
  show,
  setShow,
}: AuthenticationPageModel) {
  const { mode, setMode } = UseAuthMode();
  const { user } = useAuth();

  const handleAlignment = (
    _: React.MouseEvent<HTMLElement>,
    state: UserMode | null
  ) => {
    if (state !== null) setMode(state);
  };

  const shouldShowToggle = !user; // Only show toggle if not logged in
  const showLogin = mode === "login" && !user;
  const showSignup = mode === "signup";
  const showVerify = mode === "authenticate" || (user && !user.emailVerified);

  return (
    <Section id="AuthenticationPage">
      {show && (
        <Modal
          setShowModal={setShow}
          className="flex flex-col items-center justify-center gap-y-5"
        >
          {shouldShowToggle && (
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={handleAlignment}
              aria-label="auth toggle"
              className="flex justify-center space-x-3"
            >
              <ToggleButton value="login" aria-label="login">
                Log In
              </ToggleButton>
              <ToggleButton value="signup" aria-label="signup">
                Sign Up
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          <Header
            style={"Authentication"}
            title={
              showLogin
                ? "Log In"
                : showSignup
                ? "Sign Up"
                : showVerify
                ? "Verify Account"
                : ""
            }
          />
          {showLogin && <LogInForm />}
          {showSignup && <SignUpForm />}
          {showVerify && <VerifyAccount />}
        </Modal>
      )}
    </Section>
  );
}
