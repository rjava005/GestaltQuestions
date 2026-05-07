import AuthBase from "./AuthBase";
import { toast } from "react-toastify";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

import { auth } from "../../../../config/firebaseClient"
import { UserAPI } from "../../api";
import type { UserBase, ValidInstitutions } from "../../types";


export function SignUpForm() {
  const handleSubmit = async (
    email: string,
    password: string,
    username?: string,
    firstName?: string,
    lastName?: string,
    institution?: ValidInstitutions | null
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
        toast.info(`A verification email has been sent to ${email}.`);
      }

      const userData: UserBase = {
        first_name: firstName ?? "",
        last_name: lastName ?? "",
        username: username ?? "",
      };

      await UserAPI.createUser(user, userData, {
        institution: institution ?? null,
      });

      toast.success("Account created successfully.");
    } catch (error) {
      const errorMsg = error instanceof FirebaseError ? error.message : String(error);
      toast.error(`Could not create account: ${errorMsg}`);
    }
  };

  return <AuthBase onSubmit={handleSubmit} />;
}
