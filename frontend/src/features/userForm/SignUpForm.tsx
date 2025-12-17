import AuthBase from "../../features/userForm/AuthBase";
import { toast } from "react-toastify";
import { FirebaseError } from "firebase/app";
import { UserAPI } from "../../services/api/backend/userAPI";
import { type UserBase } from "../../types/userTypes";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
} from "firebase/auth";
import { auth } from "../../../config/firebaseClient";
import type { ValidInstitutions } from "../../types/userTypes";

export function SignUpForm() {
    const handleSubmit = async (
        email: string,
        password: string,
        firstName?: string,
        username?: string,
        lastName?: string,
        institution?: ValidInstitutions | null
    ) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            if (user && !user.emailVerified) {
                await sendEmailVerification(user);
                toast.info(`A verification email has been sent to ${email}  `);
            }
            // Add the user to the database
            const userData: UserBase = {
                email: email,
                first_name: firstName ?? "",
                last_name: lastName ?? "",
                username: username ?? "",
            };
            await UserAPI.createUserFull(user, userData, {
                institution: institution,
            });
        } catch (error) {
            let errorMsg = "";
            if (error instanceof FirebaseError) {
                errorMsg = error.message;
            } else {
                errorMsg = error as string;
            }
            toast.error(`Could not create account ${errorMsg ?? ""}`);
        }
    };

    return <AuthBase onSubmit={handleSubmit} />;
}
