import { Section } from "../components/Section";
import { Button } from "../components/Button";
import { Link } from "react-router-dom";

function Hero() {
    return (
        <Section
            id="hero"
            variant="hero"
            className="relative overflow-hidden bg-(--bg-accent)"
        >
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-surface-muted to-transparent" />
            <div className="relative max-w-3xl mx-auto px-6 py-20 text-center space-y-6">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-text">
                    Gestalt Questions
                </h1>
                <p className="text-lg text-text-muted leading-relaxed">
                    A simple workspace for creating, browsing, and managing practice questions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                    <Link to="/questions">
                        <Button
                            name="Browse Questions"
                            color="primary"
                            className="px-6 py-3 rounded-xl text-lg font-bold"
                        />
                    </Link>
                    <Link to="/createQuestion">
                        <Button
                            name="Create Question"
                            color="secondary"
                            className="px-6 py-3 rounded-xl text-lg font-bold"
                        />
                    </Link>
                </div>
            </div>
        </Section>
    );
}

function Overview() {
    return (
        <Section
            id="overview"
            variant="hero"
            className="bg-bg"
        >
            <div className="max-w-4xl mx-auto px-6 py-14 space-y-8 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-text">
                    What You Can Do
                </h2>
                <div className="grid gap-4 sm:grid-cols-3 text-left">
                    <div className="p-5 rounded-xl border border-border bg-surface">
                        <h3 className="font-semibold text-text mb-2">Create</h3>
                        <p className="text-text-muted text-sm">
                            Build questions manually with a straightforward form.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl border border-border bg-surface">
                        <h3 className="font-semibold text-text mb-2">Browse</h3>
                        <p className="text-text-muted text-sm">
                            View existing questions and review their details.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl border border-border bg-surface">
                        <h3 className="font-semibold text-text mb-2">Manage</h3>
                        <p className="text-text-muted text-sm">
                            Keep your question content organized in one place.
                        </p>
                    </div>
                </div>
            </div>
        </Section>
    );
}

export default function Home() {
    return (
        <>
            <Hero />
            <Overview />
        </>
    );
}
