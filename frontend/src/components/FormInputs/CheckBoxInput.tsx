type BooleanInputProps = {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
};

function BooleanField({
    label,
    value,
    onChange,
}: BooleanInputProps) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">{label}</span>
        </label>
    );
}

export default BooleanField