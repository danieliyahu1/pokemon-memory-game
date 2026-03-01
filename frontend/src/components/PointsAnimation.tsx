import React, { useEffect, useState } from "react";

type PointsAnimationProps = {
  show: boolean;
  position: "left" | "right";
};

const PointsAnimation: React.FC<PointsAnimationProps> = ({
  show,
  position,
}) => {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [show]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed top-1/3 pointer-events-none z-50 ${
        position === "left" ? "left-1/4" : "right-1/4"
      }`}
    >
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(1.2);
          }
        }
        .points-float {
          animation: floatUp 1.5s ease-out forwards;
        }
      `}</style>
      <div className="points-float text-4xl font-bold text-green-400 drop-shadow-lg">
        +1
      </div>
    </div>
  );
};

export default PointsAnimation;
