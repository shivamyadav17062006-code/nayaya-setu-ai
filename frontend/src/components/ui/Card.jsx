export function Card({
  children,
  variant = "default",
  className = "",
  ...props
}) {
  const baseStyles = "rounded-2xl transition-all duration-200";
  const variants = {
    default: "bg-white border border-slate-200 shadow-sm p-6",
    flat: "bg-slate-50 border border-slate-100 p-6",
    outline: "bg-transparent border border-slate-300 p-6",
    interactive: "bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 cursor-pointer p-6"
  };
  return <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>{children}</div>;
}
