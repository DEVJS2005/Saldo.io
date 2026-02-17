import { createContext, useContext, useState } from 'react';

const DateContext = createContext();

export function DateProvider({ children }) {
    const [selectedDate, setSelectedDateState] = useState(() => {
        const saved = localStorage.getItem('selectedDate');
        return saved ? new Date(saved) : new Date();
    });

    const setSelectedDate = (date) => {
        localStorage.setItem('selectedDate', date.toISOString());
        setSelectedDateState(date);
    };

    return (
        <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
            {children}
        </DateContext.Provider>
    );
}

export function useDate() {
    const context = useContext(DateContext);
    if (!context) {
        throw new Error('useDate must be used within a DateProvider');
    }
    return context;
}
