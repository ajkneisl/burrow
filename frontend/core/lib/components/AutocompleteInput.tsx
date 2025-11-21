import clsx from "clsx"
import {
    useState,
    useRef,
    useEffect,
    type DetailedHTMLProps,
    type InputHTMLAttributes,
    type ReactNode
} from "react"

/**
 * An option for the autocomplete.
 */
export type AutocompleteOption<T = string> = {
    label: string
    value: T
}

/**
 * {@link AutocompleteInput}.
 */
type AutocompleteInputProps<T = string> = {
    text?: string
    remark?: string
    error?: boolean
    options: AutocompleteOption<T>[]
    onSelect: (option: AutocompleteOption<T>) => void
    endAdornment?: ReactNode
    startAdornment?: ReactNode
    filterOptions?: (
        options: AutocompleteOption<T>[],
        inputValue: string
    ) => AutocompleteOption<T>[]
    renderOption?: (option: AutocompleteOption<T>) => ReactNode
    noOptionsText?: string
} & Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    "onSelect"
>

/**
 * An input with autocomplete dropdown.
 *
 * @param text The text for the label.
 * @param remark An optional remark below the input.
 * @param options The list of autocomplete options.
 * @param onSelect Callback when an option is selected.
 * @param endAdornment A button or icon to place at the end of the input.
 * @param startAdornment A button or icon to place at the start of the input.
 * @param filterOptions Custom filter function for options. Defaults to case-insensitive label match.
 * @param renderOption Custom render function for options.
 * @param noOptionsText Text to show when no options match.
 * @param error If there's an error with the input.
 * @param props Props to apply ot the input

 * @author AJ Kneisl
 */
export default function AutocompleteInput<T = string>({
    text,
    remark,
    error,
    options,
    onSelect,
    endAdornment,
    startAdornment,
    filterOptions,
    renderOption,
    noOptionsText = "No options",
    ...props
}: AutocompleteInputProps<T>) {
    const [isOpen, setIsOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const [inputValue, setInputValue] = useState(
        (props.value as string) || (props.defaultValue as string) || ""
    )

    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    // filter through provided options
    const filteredOptions = filterOptions
        ? filterOptions(options, inputValue)
        : options.filter((option) =>
              option.label.toLowerCase().includes(inputValue.toLowerCase())
          )

    // close suggested results on click out
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () =>
            document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        setHighlightedIndex(0)
    }, [filteredOptions.length])

    // scroll options into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const highlighted = listRef.current.children[
                highlightedIndex
            ] as HTMLElement
            if (highlighted) {
                highlighted.scrollIntoView({ block: "nearest" })
            }
        }
    }, [highlightedIndex, isOpen])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)
        setIsOpen(true)
        props.onChange?.(e)
    }

    const handleSelect = (option: AutocompleteOption<T>) => {
        setInputValue(option.label)
        setIsOpen(false)
        onSelect(option)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                setIsOpen(true)
                e.preventDefault()
            }
            return
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setHighlightedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                )
                break
            case "ArrowUp":
                e.preventDefault()
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                )
                break
            case "Enter":
                e.preventDefault()
                if (filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex])
                }
                break
            case "Escape":
                setIsOpen(false)
                break
            case "Tab":
                setIsOpen(false)
                break
        }

        props.onKeyDown?.(e)
    }

    return (
        <div ref={wrapperRef} className="relative w-full">
            {text && (
                <label
                    htmlFor={props.id}
                    className="figree mb-1 block text-sm font-medium"
                >
                    {text}
                </label>
            )}

            <div
                className={clsx(
                    "relative flex items-center rounded-lg border border-neutral-300 bg-hero-50/80 shadow-inner transition",
                    "focus-within:border-secondary focus-within:bg-hero-50/60 focus-within:ring-2 focus-within:ring-emerald-500/30",
                    error &&
                        "border-red-300 focus-within:border-red-500 focus-within:ring-red-300/40",
                    (props.readOnly || props.disabled) &&
                        "cursor-not-allowed opacity-60"
                )}
            >
                {startAdornment && (
                    <div className="flex items-center pl-3">
                        {startAdornment}
                    </div>
                )}

                <input
                    ref={inputRef}
                    {...props}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => {
                        setIsOpen(true)
                        props.onFocus?.(e)
                    }}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-autocomplete="list"
                    className={clsx(
                        "w-full bg-transparent py-3 text-[15px] outline-none placeholder:text-text/40",
                        startAdornment ? "pl-2" : "pl-3",
                        endAdornment ? "pr-2" : "pr-3",
                        (props.readOnly || props.disabled) &&
                            "cursor-not-allowed text-text/60",
                        props.className
                    )}
                />

                {endAdornment && (
                    <div className="flex items-center pr-3">{endAdornment}</div>
                )}
            </div>

            {/* dropdown */}
            {isOpen && (
                <ul
                    ref={listRef}
                    role="listbox"
                    className="border-card-border bg-card absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border shadow-lg"
                >
                    {filteredOptions.length === 0 ? (
                        <li className="text-text/50 px-3 py-2 text-sm">
                            {noOptionsText}
                        </li>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <li
                                key={String(option.value)}
                                role="option"
                                aria-selected={index === highlightedIndex}
                                onClick={() => handleSelect(option)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={clsx(
                                    "text-text cursor-pointer px-3 py-2 text-sm transition-colors",
                                    index === highlightedIndex &&
                                        "bg-secondary/10 text-secondary"
                                )}
                            >
                                {renderOption
                                    ? renderOption(option)
                                    : option.label}
                            </li>
                        ))
                    )}
                </ul>
            )}

            {remark && <p className="mt-1 text-xs text-text/60">{remark}</p>}
        </div>
    )
}
