import { format } from "date-fns";
import numeral from "numeral";

// Format a date to "dd/MM/yyyy kk:mm"
export default function formatDate(date?: Date | string | number): string {
  return format(date ? new Date(date) : new Date(), "dd/MM/yyyy kk:mm");
}

// Convert a timestamp (in seconds) to a formatted date
export function TimestampToDate({ timestamp }: { timestamp: number }): string {
  return format(new Date(timestamp * 1000), "dd/MM/yyyy HH:mm");
}

// Format a date to "dd/MM/yyyy"
export function formatToDate(date?: Date | string | number): string {
  return format(date ? new Date(date) : new Date(), "dd/MM/yyyy");
}

// Format a date to return only the year
export function formatDateToYear(date?: Date | string | number): string {
  return format(date ? new Date(date) : new Date(), "yyyy");
}

// Register Indonesian locale for numeral.js
numeral.register("locale", "id", {
  delimiters: {
    thousands: ".",
    decimal: ",",
  },
  abbreviations: {
    thousand: "rb",
    million: "jt",
    billion: "m",
    trillion: "t",
  },
  ordinal: () => "", // **Fix: Added ordinal function**
  currency: {
    symbol: "Rp",
  },
});

numeral.locale("id");

// Format a number as currency
export function currency(number: number): string {
  return numeral(number).format("$0,0"); // "Rp" symbol is already set in locale
}

// Format a number with two decimal places
export function decimal(number: number): string {
  return numeral(number).format("$0,0.00");
}
