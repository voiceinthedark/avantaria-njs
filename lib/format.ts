// Display helpers shared by dashboard pages.

// TODO: make the currency configurable once it is decided.
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatCurrency = (amount: number | string) => currency.format(Number(amount));

const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export const formatDateTime = (date: Date) => `${dateTime.format(date)} UTC`;
