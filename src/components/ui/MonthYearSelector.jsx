import { addMonths, subMonths, format, setMonth, setYear, getYear, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export const MonthYearSelector = ({ selectedDate, onChange }) => {
    const currentYear = getYear(selectedDate);
    const currentMonth = getMonth(selectedDate);

    const handlePrevMonth = () => onChange(subMonths(selectedDate, 1));
    const handleNextMonth = () => onChange(addMonths(selectedDate, 1));

    const handleYearChange = (e) => {
        const newYear = parseInt(e.target.value, 10);
        onChange(setYear(selectedDate, newYear));
    };

    const handleMonthChange = (e) => {
        const newMonth = parseInt(e.target.value, 10);
        onChange(setMonth(selectedDate, newMonth));
    };

    // Generate year range (e.g., current - 5 to current + 5)
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
    // Or fixed range? User wants "past, future". Dynamic based on current seems best.
    // actually better to have a wider range or center on selected
    const yearOptions = Array.from({ length: 21 }, (_, i) => (currentYear - 10) + i);
    // Wait, if I select 2030, the range shifts. That's good.

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return (
        <div className="flex items-center gap-2 bg-[var(--bg-card)] p-1 rounded-xl shadow-sm border border-[var(--border-color)]">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft size={20} />
            </Button>

            <div className="flex items-center gap-1">
                {/* Month Select */}
                <select
                    value={currentMonth}
                    onChange={handleMonthChange}
                    className="bg-transparent font-semibold text-[var(--text-primary)] appearance-none cursor-pointer text-center outline-none focus:text-[var(--primary)]"
                >
                    {months.map((m, i) => (
                        <option key={i} value={i} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                            {m}
                        </option>
                    ))}
                </select>

                {/* Year Select */}
                <select
                    value={currentYear}
                    onChange={handleYearChange}
                    className="bg-transparent font-bold text-[var(--text-primary)] appearance-none cursor-pointer outline-none focus:text-[var(--primary)]"
                >
                    {yearOptions.map((year) => (
                        <option key={year} value={year} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                <ChevronRight size={20} />
            </Button>
        </div>
    );
};
