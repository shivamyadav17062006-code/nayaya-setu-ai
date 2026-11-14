export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
export function formatDate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
export function formatTime(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
export function truncate(str, length = 60) {
  return str.length > length ? str.slice(0, length) + "..." : str;
}
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
export function formatIndianNumber(num) {
  return num.toLocaleString("en-IN");
}
