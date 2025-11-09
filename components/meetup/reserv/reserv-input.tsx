import { cn } from "@/lib/utils";

interface ReservInputProps {
  name?: string;
  placeholder?: string;
  description?: string;
  className?: string;
}

export default function ReservInput({
  name,
  placeholder,
  description,
  className,
}: ReservInputProps) {
  return (
    <div className="flex flex-col gap-1 leading-none align-middle [hanging-punctuation:first]">
      <p className="text-sm font-medium">
        {name} <span className="text-red-500">*</span>
      </p>
      <input
        name={name}
        placeholder={placeholder}
        className={cn(
          "bg-white border border-[#b7b7b7] pl-3 rounded-[10px] h-9 focus:outline-none placeholder:text-sm placeholder:font-normal placeholder:text-[#777777]",
          className
        )}
        required
      ></input>
      <p className="text-[13px] font-light px-2">{description}</p>
    </div>
  );
}
