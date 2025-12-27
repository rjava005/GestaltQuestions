type QuestionLibraryHeaderProps = {
    title: string;
};

export default function QuestionLibraryHeader({
    title,
}: QuestionLibraryHeaderProps) {
    return (
        <div className="flex w-full flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
            <div className="flex items-center justify-between gap-4">
                <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {title}
                </h1>
            </div>
        </div>
    );
}
