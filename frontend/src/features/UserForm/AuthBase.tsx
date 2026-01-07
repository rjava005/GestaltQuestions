import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/Button";
import { InputTextForm } from "../../components/FormInputs/InputComponents";
import { UseAuthMode } from "../../context/AuthMode";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { toast } from "react-toastify";
import { SelectComponent } from "../../components/FormInputs/SelectComponent";
import { AllowedInstitutions, type ValidInstitutions } from "../../types/userTypes";

type AuthProps = {
    onSubmit: (
        email: string,
        password: string,
        username?: string,
        firstName?: string,
        lastName?: string,
        institution?: ValidInstitutions | null
    ) => Promise<void>;
};
export default function AuthBase({ onSubmit }: AuthProps) {
    const { mode, setMode } = UseAuthMode();
    const auth = getAuth();

    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");

    const [username, setUserName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [institution, setInstituion] = useState<ValidInstitutions | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (mode === "passwordReset") {
            await handlePasswordReset();
        } else {
            onSubmit(email, password, username, firstName, lastName, institution);
        }
    };

    const handlePasswordReset = async () => {
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success(`Password reset sent to ${email} (Check spam)`);
        } catch (error) {
            toast.error("Could not reset password");
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-y-5 items-center justify-center w-full h-full"
            id={mode}
        >
            {/* Name and username field — only for signup */}

            <div className="grid sm:grid-cols-2 gap-y-2 gap-x-0 place-content-center justify-items-center w-fit mx-auto">
                {mode === "signup" && (
                    <>
                        <InputTextForm
                            value={firstName}
                            id="first-name"
                            type="text"
                            name="firstName"
                            label="First Name"
                            placeholder="Freddy"
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        <InputTextForm
                            value={lastName}
                            id="last-name"
                            type="text"
                            name="Last Name"
                            label="Last Name"
                            placeholder="Freddy"
                            onChange={(e) => setLastName(e.target.value)}
                        />
                        <InputTextForm
                            value={username}
                            id="username"
                            type="text"
                            name="username"
                            label="Username"
                            placeholder="FreeBodyFreddy"
                            onChange={(e) => setUserName(e.target.value)}
                        />
                    </>
                )}
                {/* Email field always show */}
                <InputTextForm
                    value={email}
                    id="email"
                    type="email"
                    name="email"
                    label="Email"
                    placeholder="FBody@email.com"
                    onChange={(e) => setEmail(e.target.value)}
                />

                {/* Password field — hidden only during password reset */}
                {mode !== "passwordReset" && (
                    <InputTextForm
                        value={password}
                        id="password"
                        type="password"
                        name="password"
                        label="Password"
                        placeholder="*********"
                        onChange={(e) => setPassword(e.target.value)}
                    >
                        {mode === "login" && (
                            <div
                                onClick={() => setMode("passwordReset")}
                                className="text-sm text-violet-300 cursor-pointer hover:underline mt-2"
                            >
                                Forgot Password?
                            </div>
                        )}
                    </InputTextForm>
                )}
                {/* For layout purposes have the institution as the last element */}
                {mode === "signup" && (
                    <>
                        <SelectComponent
                            label="Choose your University:"
                            options={AllowedInstitutions}
                            value={institution as string}
                            onChange={(v) =>
                                setInstituion(v.target.value as ValidInstitutions)
                            }
                        />
                    </>
                )}
            </div>

            <Button
                type="submit"
                name={
                    mode === "login"
                        ? "Log In"
                        : mode === "signup"
                            ? "Sign Up"
                            : mode === "passwordReset"
                                ? "Send Password Reset"
                                : "Continue"
                }
            />
            {mode === "passwordReset" && (
                <Button
                    type="button" // prevent form submission
                    name="Go Back to Login"
                    onClick={() => setMode("login")}
                    size="md"
                />
            )}
        </form>
    );
}
