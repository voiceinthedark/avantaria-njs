// Display helpers shared by dashboard pages.

// TODO: make the currency configurable once it is decided.
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Accepts Prisma Decimals too (anything whose string form is a number).
export const formatCurrency = (amount: number | string | { toString(): string }) =>
  currency.format(Number(amount.toString()));

const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export const formatDateTime = (date: Date) => `${dateTime.format(date)} UTC`;
