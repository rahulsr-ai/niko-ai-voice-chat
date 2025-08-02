
const SpeakingLine: React.FC = () => {
  return (
    <div className="flex gap-1 items-center justify-center h-20">
      {[...Array(20)].map((_, i) => (
        <div key={i} className={`w-0.5 bg-green-500 animate-line`} style={{ animationDelay: `${i * 0.05}s` }} />
      ))}
    </div>
  );
};

export default SpeakingLine;
