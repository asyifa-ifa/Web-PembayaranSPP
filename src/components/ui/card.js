export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-green-200 bg-white shadow-md hover:shadow-lg transition p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`mt-2 ${className}`} {...props}>
      {children}
    </div>
  );
}
