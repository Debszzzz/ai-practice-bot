const variants = {
  primary: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
  outline: "border-blue-200 bg-transparent text-blue-600 hover:bg-blue-50",
  soft: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
};

function Button({ children, variant = "primary", className = "", ...props }) {
  const buttonProps = { ...props };
  delete buttonProps.style;

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] || variants.primary} ${className}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

export default Button;
