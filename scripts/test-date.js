
import { addMonths } from 'date-fns';

const data = {
    date: "2026-10-02",
    installments: 3,
    startInstallment: 1,
    amount: "100"
};

const startDate = new Date(data.date); 
startDate.setUTCHours(12, 0, 0, 0);

console.log('StartDate:', startDate.toISOString());

const totalInstallments = 3;
const startInstallment = 1;
const loopCount = Math.max(0, totalInstallments - startInstallment + 1);

for (let i = 0; i < loopCount; i++) {
    const nextDate = addMonths(startDate, i);
    console.log(`i=${i}, Date=${nextDate.toISOString()}`);
}
