
export default function GeminiThinking() {
  return (
    <div className="flex flex-col items-center mt-6 gap-2">
      <p className="text-xl font-semibold text-indigo-300 animate-pulse tracking-wider">
        👽 NIKO is thinking...
      </p>
      <div className="flex gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 shadow-md animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
