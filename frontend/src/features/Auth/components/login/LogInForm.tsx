import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-toastify";

import { auth } from "../../../../config/firebaseClient";
import AuthBase from "./AuthBase";

export function LogInForm() {
  const handleSubmit = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Log in successful.");
    } catch (error) {
      toast.error(`Could not log in: ${String(error)}`);
    }
  };

  return <AuthBase onSubmit={handleSubmit} />;
}
