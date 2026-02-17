import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { addMonths, format, startOfMonth, endOfMonth } from 'date-fns';

export function useTransactions() {
  const addTransaction = async (data) => {
    const {
      amount,
      date, // Date object or ISO string
      description,
      categoryId,
      accountId,
      type, // 'receita', 'despesa', 'transferencia'
      isRecurring,
      installments = 1,
    } = data;

    // Fix: Appending T12:00:00 ensures we stay in the same day regardless of timezone (unless offset > 12h)
    // Alternatively, treat YYYY-MM-DD as local.
    const startDate = new Date(date + 'T12:00:00');
    const totalAmount = parseFloat(amount);
    
    // VALIDATION
    if (!amount || !date || !categoryId || !accountId) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos.');
    }

    // Base transaction object for common properties
    const baseTransaction = {
      type,
      categoryId,
      accountId,
      amount: totalAmount,
      description,
      paymentStatus: data.paymentStatus || 'pending', // Default to pending if not provided
    };

    // HANDLE RECURRING
    if (data.isRecurring) {
      // 1. Current Month
      const current = {
        ...baseTransaction,
        date: startDate,
        month: startDate.getMonth(),
        year: startDate.getFullYear(),
        recurrenceId: crypto.randomUUID(),
        isRecurring: true
      };
      
      const transactionsToAdd = [current];

      // 2. Future Months (Generate next 11 months for projection - user can then "import" them later or we just show them)
      // Actually, standard pattern: Create just ONE with isRecurring=true (the one acting as "Model").
      // OR Create for next X months.
      
      // Decision: Let's create current + next 11 months to populate the year.
      for (let i = 1; i < 12; i++) {
        const nextDate = addMonths(startDate, i);
        transactionsToAdd.push({
          ...baseTransaction,
          date: nextDate,
          month: nextDate.getMonth(),
          year: nextDate.getFullYear(),
          recurrenceId: current.recurrenceId,
          isRecurring: true,
          paymentStatus: 'pending' // Future ones are pending by default
        });
      }

      await db.transactions.bulkAdd(transactionsToAdd);
    } 
    // HANDLE INSTALLMENTS (Despesa only)
    else if (type === 'despesa' && installments > 1) {
      const installmentId = crypto.randomUUID();
      const baseValue = Math.floor((totalAmount / installments) * 100) / 100;
      let currentSum = 0;
      const transactionsToAdd = [];
      const startParcel = data.currentInstallment || 1;
      const countToGenerate = installments - startParcel + 1;

      for (let i = 0; i < countToGenerate; i++) {
        const parcelNumber = startParcel + i;
        const isLast = parcelNumber === Number(installments);
        
        // Fix precision
        // Calculation logic:
        // Value of ONE parcel = total / totalInstallments.
        // We are generating 'countToGenerate' items.
        // The last item of the WHOLE series absorbs the rounding diff.
        
        const finalParcelValue = isLast 
            ? Number((totalAmount - (baseValue * (Number(installments) - 1))).toFixed(2)) 
            : baseValue;

        const parcelDate = addMonths(startDate, i); // i=0 is today (or selected date)

        transactionsToAdd.push({
          date: parcelDate,
          month: parcelDate.getMonth(),
          year: parcelDate.getFullYear(),
          type,
          categoryId,
          accountId,
          amount: finalParcelValue,
          description: `${description} (${parcelNumber}/${installments})`,
          paymentStatus: 'pending',
          installmentId,
          installmentNumber: parcelNumber,
          totalInstallments: Number(installments),
          isRecurring: false,
        });
      }

      await db.transactions.bulkAdd(transactionsToAdd);
    } 
    // 6. Single Ordinary Transaction
    else {
      await db.transactions.add({
        date: startDate,
        month: startDate.getMonth(),
        year: startDate.getFullYear(),
        type,
        categoryId,
        accountId,
        amount: totalAmount,
        description,
        paymentStatus: data.paymentStatus || 'pending',
        isRecurring: false,
      });
    }
  };

  const deleteTransaction = async (id, deleteMode = 'single') => {
    // deleteMode: 'single' | 'future' | 'all'
    const transaction = await db.transactions.get(id);
    if (!transaction) return;

    if (transaction.recurrenceId) {
        if (deleteMode === 'all') {
            await db.transactions.where('recurrenceId').equals(transaction.recurrenceId).delete();
        } else if (deleteMode === 'future') {
            // Delete this and all future ones with same recurrenceId
            await db.transactions
                .where('recurrenceId').equals(transaction.recurrenceId)
                .and(t => t.date >= transaction.date)
                .delete();
        } else {
            await db.transactions.delete(id);
        }
    } else if (transaction.installmentId) {
         // Should we support deleting single installment? Usually yes.
         // If user wants to delete ALL installments, we should probably support that too.
         // For now, let's keep simple delete for installments unless requested otherwise.
         if (deleteMode === 'all') {
             await db.transactions.where('installmentId').equals(transaction.installmentId).delete();
         } else {
             await db.transactions.delete(id);
         }
    } else {
        await db.transactions.delete(id);
    }
  };

  const getTransactionsByMonth = (date) => {
    // This expects a Date object
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return useLiveQuery(() => 
      db.transactions
        .where('date')
        .between(start, end, true, true)
        .reverse()
        .sortBy('date')
    );
  };

  const fixRecurrences = async () => {
      // 1. Find all recurring transactions without ID
      const legacy = await db.transactions
        .filter(t => t.isRecurring && !t.recurrenceId)
        .toArray();

      if (legacy.length === 0) return { count: 0, message: 'Nenhuma recorrência antiga encontrada.' };

      let updatedCount = 0;
      let createdCount = 0;

      await db.transaction('rw', db.transactions, async () => {
          for (const t of legacy) {
              const newId = crypto.randomUUID();
              
              // Update the source transaction
              await db.transactions.update(t.id, { recurrenceId: newId });
              updatedCount++;

              // Check/Create for next 12 months
              const startDate = new Date(t.date);

              for (let i = 1; i <= 12; i++) {
                  const nextDate = addMonths(startDate, i);
                  const nextMonth = nextDate.getMonth();
                  const nextYear = nextDate.getFullYear();

                  // Check collisions (same description, same month/year, same type)
                  const collision = await db.transactions
                    .where({ 
                        month: nextMonth, 
                        year: nextYear, 
                        description: t.description,
                        type: t.type 
                    })
                    .first();

                  if (collision) {
                      // Found existing copy (from old Import). Link it!
                      if (!collision.recurrenceId) {
                          await db.transactions.update(collision.id, { recurrenceId: newId, isRecurring: true });
                          updatedCount++;
                      }
                  } else {
                      // Create new future transaction
                      await db.transactions.add({
                        ...t,
                        date: nextDate,
                        month: nextMonth,
                        year: nextYear,
                        // Remove id to auto-increment
                        id: undefined, 
                        // Set new recurrenceId
                        recurrenceId: newId,
                        paymentStatus: 'pending' // Futures are pending
                      });
                      createdCount++;
                  }
              }
          }
      });

      return { count: legacy.length, message: `Migração completa! ${legacy.length} originais processados. ${createdCount} novas geradas, ${updatedCount} atualizadas.` };
  };

  /* 
   * Update Transaction with Propagation Support
   * mode: 'single' | 'future' | 'all'
   */
  const updateTransaction = async (id, data, mode = 'single') => {
    // Exclude special fields that shouldn't change blindly if passed improperly
    const { currentInstallment, ...validData } = data;

    // Ensure date is a Date object if present
    if (validData.date) {
        let newDate = validData.date;

        // If it's a string (YYYY-MM-DD), append time to avoid timezone shifts
        if (typeof newDate === 'string') {
             const isFullISO = newDate.includes('T');
             newDate = new Date(isFullISO ? newDate : newDate + 'T12:00:00');
        }

        // Validate date
        if (!isNaN(newDate.getTime())) {
             validData.date = newDate;
             validData.month = newDate.getMonth();
             validData.year = newDate.getFullYear();
        }
    }

    // HANDLE TOGGLING RECURRENCE ON EDIT (Logic remains the same for single conversion)
    // If user sets isRecurring=true, we might need to generate future items if they don't exist
    if (validData.isRecurring) {
        const original = await db.transactions.get(id);
        
        // If it wasn't recurring before (or didn't have a recurrenceId), we treat it as a new series
        if (original && !original.recurrenceId) {
            const recurrenceId = crypto.randomUUID();
            validData.recurrenceId = recurrenceId;

            // Generate for next 11 months
            const transactionsToAdd = [];
            const startDate = validData.date || original.date;
            
            const baseData = { ...original, ...validData, recurrenceId };

            for (let i = 1; i < 12; i++) {
                const nextDate = addMonths(startDate, i);
                transactionsToAdd.push({
                    ...baseData,
                    id: undefined, // Create new lines
                    date: nextDate,
                    month: nextDate.getMonth(),
                    year: nextDate.getFullYear(),
                    isRecurring: true,
                    paymentStatus: 'pending', // Future ones are pending
                    recurrenceId
                });
            }
            await db.transactions.bulkAdd(transactionsToAdd);
            
            // Update the original to have the ID too
            await db.transactions.update(id, validData);
            return; // Exit here as we converted a single to recurring, standard flow.
        }
    }

    // HANDLE PROPAGATION
    const original = await db.transactions.get(id);
    if (!original) return;

    // Helper to get query for series
    const updateSeries = async (queryFilter) => {
        // Find all matching transactions
        const related = await db.transactions.filter(queryFilter).toArray();
        
        // Update them
        // We must be careful NOT to update fields that are unique to each transaction (like Date, unless shifted?)
        // For this feature request: "Change Category, Account, Description etc."
        // We should probably NOT change Date or Amount (unless explicitly requested, but amount is handled by caller passing it in validData)
        // actually, validData DOES contain the new amount if changed.
        
        // Fields to propagate:
        // Description (maybe? usually yes if fixing a typo), Category, Account, Type.
        // PaymentStatus? Maybe not.
        // Amount? Yes, if passed.
        
        // If we represent a "shift" in date, that's complex. For now assuming date stays relative or is untouched if not logic implemented.
        // But wait, validData.date IS the new date of THIS transaction.
        // If I change Jan 15 to Jan 20, should Feb 15 become Feb 20? 
        // User didn't ask for date shift explicitely, mainly Category/Account.
        // Let's stick to updating "metadata" fields and Amount.
        
        // If we are updating 'future', and we changed the Date of the CURRENT ONE...
        // It's safer to NOT propagate Date changes to the series automatically unless we calculate offsets.
        // For MVP: Do NOT propagate Date. Propagate: description, amount, categoryId, accountId, type, isRecurring.

        const fieldsToUpdate = { ...validData };
        delete fieldsToUpdate.id;
        delete fieldsToUpdate.date; // Don't sync dates to single value
        delete fieldsToUpdate.month;
        delete fieldsToUpdate.year;
        delete fieldsToUpdate.paymentStatus; // Don't reset status of others? Or should we?
        // " A alteração de categoria deve se propagar... mudança de conta... menos a edição do valor"
        // If mode is 'future'/'all' and we passed a new amount, we update amount.

        // If 'paymentStatus' changed, do we propagate? User didn't explicitly say.
        // Usually if I mark "Paid", I don't mark all future as "Paid".
        // So deleting paymentStatus from propagation seems correct.

        await db.transaction('rw', db.transactions, async () => {
            for (const t of related) {
                // If we are updating installments, and amount is changed, we update all installments?
                // Or if we are updating recurrence.
                if (t.id === id) continue; // Skip self, will be updated at end

                await db.transactions.update(t.id, fieldsToUpdate);
            }
        });
    };

    if (mode === 'all' || mode === 'future') {
        if (original.recurrenceId) {
            await updateSeries(t => {
                const matchId = t.recurrenceId === original.recurrenceId;
                if (!matchId) return false;
                if (mode === 'future') return t.date >= original.date;
                return true;
            });
        } else if (original.installmentId) {
             await updateSeries(t => {
                const matchId = t.installmentId === original.installmentId;
                if (!matchId) return false;
                // For installments, "future" usually means parcels forward.
                // But typically changing category/account affects ALL parcels.
                // If user selected 'future', we respect it.
                if (mode === 'future') return t.installmentNumber >= original.installmentNumber;
                return true;
            });
        }
    }

    // Update the target transaction itself (including Date/Status which were skipped in spread)
    await db.transactions.update(id, validData);
  };

  const validateAndRepairTransactions = async () => {
      const all = await db.transactions.toArray();
      let fixedCount = 0;
      
      await db.transaction('rw', db.transactions, async () => {
          for (const t of all) {
              let needsUpdate = false;
              let newDate = t.date;
              
              // Case 1: Date is stored as string
              if (typeof t.date === 'string') {
                  const isFullISO = t.date.includes('T');
                  newDate = new Date(isFullISO ? t.date : t.date + 'T12:00:00');
                  needsUpdate = true;
              }
              
              // Case 2: Month/Year is NaN/Invalid or mismatch
              // Ensure we have a valid date object before checking methods
              if (newDate instanceof Date && !isNaN(newDate)) {
                  const expectedMonth = newDate.getMonth();
                  const expectedYear = newDate.getFullYear();
                  
                  if (t.month !== expectedMonth || t.year !== expectedYear || Number.isNaN(t.month)) {
                      needsUpdate = true;
                  }

                  if (needsUpdate) {
                      await db.transactions.update(t.id, {
                          date: newDate,
                          month: expectedMonth,
                          year: expectedYear
                      });
                      fixedCount++;
                  }
              }
          }
      });
      return { count: fixedCount, message: `Reparo concluído! ${fixedCount} transações corrigidas.` };
  };

  return {
    addTransaction,
    deleteTransaction,
    updateTransaction,
    getTransactionsByMonth,
    fixRecurrences,
    validateAndRepairTransactions
  };
}
