interface ReservInputProps {
  name?: string;
  placeholder?: string;
  description?: string;
}

export default function ReservInput({
  name,
  placeholder,
  description,
}: ReservInputProps) {
  return (
    <div className="flex flex-col gap-1 leading-none align-middle [hanging-punctuation:first]">
      <p className="text-sm font-medium">
        {name} <span className="text-red-500">*</span>
      </p>
      <input
        placeholder={placeholder}
        className="bg-white border border-[#b7b7b7] rounded-[10px] h-9 focus:outline-none placeholder:text-sm placeholder:font-normal placeholder:text-[#777777] placeholder:pl-3"
        required
      ></input>
      <p className="text-[13px] font-light">{description}</p>
    </div>
  );
}
