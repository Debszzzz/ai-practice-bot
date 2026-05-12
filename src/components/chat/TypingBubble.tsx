function TypingBubble() {
  const dots = [
    "animate-[bounce_1.2s_infinite_0ms]",
    "animate-[bounce_1.2s_infinite_200ms]",
    "animate-[bounce_1.2s_infinite_400ms]",
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl rounded-bl-sm border border-blue-100 bg-white px-4 py-3 shadow-sm">
      {dots.map((className) => (
        <div
          key={className}
          className={`h-2 w-2 rounded-full bg-blue-200 ${className}`}
        />
      ))}
    </div>
  );
}

export default TypingBubble;
