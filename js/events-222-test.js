/* IDOL PLANNER v1.1 — pure event totals and display helpers. */
(function () {
  "use strict";
const calculateTotal = (expenses) => expenses ? expenses.reduce((sum, i) => sum + (Number(i.amount)||0), 0) : 0;
                const getTicketPrice = (expenses) => {
                    if (!expenses || !Array.isArray(expenses)) return 0;
                    return expenses.reduce((sum, item) => {
                        const name = item.item ? item.item.toLowerCase() : '';
                        if (name.includes('門票') || name.includes('ticket')) {
                            return sum + (Number(item.amount) || 0);
                        }
                        return sum;
                    }, 0);
                };
const formatMoney = (v) => v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '0';
                const getDay = (d) => new Date(d).getDate();
                const getMonth = (d) => ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][new Date(d).getMonth()];
                const getDaysDiff = (d) => Math.ceil((new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0))/(1000*60*60*24));
  window.IdolPlannerEvents = Object.freeze({ calculateTotal, getTicketPrice, formatMoney, getDay, getMonth, getDaysDiff });
})();
