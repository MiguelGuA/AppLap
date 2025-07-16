export default function Button({
  children,
  onClick,
  className = "",
  variant = "primary",
  type = "button",
}) {
  const base = "px-4 py-2 rounded transition font-semibold";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-400 text-gray-700 bg-white hover:bg-gray-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };

  const variantClass = variants[variant] || variants.primary;

  return (
    <button onClick={onClick} type={type} className={`${base} ${variantClass} ${className}`}>
      {children}
    </button>
  );
}
