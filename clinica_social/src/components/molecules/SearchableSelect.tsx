import React, { useState, useEffect, useRef } from 'react';

interface Option {
    id: string;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = "Selecione...", className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const selectedOption = options.find(o => o.id === value);
        if (selectedOption) {
            setSearch(selectedOption.label);
        } else {
            setSearch('');
        }
    }, [value, options]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Reset search to selected value if closing without selection
                const selectedOption = options.find(o => o.id === value);
                if (selectedOption) {
                    setSearch(selectedOption.label);
                } else if (!value) {
                    setSearch('');
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef, value, options]);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (option: Option) => {
        onChange(option.id);
        setSearch(option.label);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                        if (e.target.value === '') {
                            onChange('');
                        }
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearch(''); // Clear search on focus to show all options or let user type? 
                        // Actually, let's keep the value if selected, but maybe select all text?
                        // User asked for "appearing all patients... and typing name checks". 
                        // Let's clear search on click if user wants to search new
                    }}
                    onClick={() => {
                        if (value) setSearch(''); // Clear if user clicks to search again
                        setIsOpen(true);
                    }}
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.id}
                                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${option.id === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                                onClick={() => handleSelect(option)}
                            >
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-slate-400 italic">Nenhuma opção encontrada</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
