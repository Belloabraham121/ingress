"use client";

export const AnimatedBackground = ({ hovering }: { hovering: boolean }) => {
  return (
    <div
      id="webgl"
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, #000000, #0a0a0a)",
      }}
    >
      {/* Animated gradient orbs - much more visible */}
      <div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-40 blur-[100px] animate-pulse"
        style={{
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
          animationDuration: hovering ? "1.5s" : "3s",
        }}
      />
      <div
        className="absolute top-1/2 right-1/4 w-[600px] h-[600px] rounded-full opacity-35 blur-[100px] animate-pulse"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          animationDuration: hovering ? "2s" : "4s",
          animationDelay: "0.5s",
        }}
      />
      <div
        className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] rounded-full opacity-30 blur-[100px] animate-pulse"
        style={{
          background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
          animationDuration: hovering ? "2.5s" : "5s",
          animationDelay: "1s",
        }}
      />

      {/* Additional moving gradients for more dynamism */}
      <div
        className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full opacity-25 blur-[80px] animate-pulse"
        style={{
          background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)",
          animationDuration: hovering ? "2s" : "4.5s",
          animationDelay: "1.5s",
        }}
      />

      {/* Floating particles - more visible */}
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white/50 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: hovering
                ? `${8 + Math.random() * 4}s`
                : `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Vignette effect - slightly lighter */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
};
