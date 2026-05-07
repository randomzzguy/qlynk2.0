"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(15, 15, 25)",
  gradientBackgroundEnd = "rgb(25, 25, 35)",
  firstColor = "99, 102, 241",
  secondColor = "168, 85, 247",
  thirdColor = "236, 72, 153",
  _fourthColor = "59, 130, 246",
  _fifthColor = "34, 197, 94",
  pointerColor = "99, 102, 241",
  _size = "80%",
  blendingValue = "normal",
  children,
  className,
  interactive = false, // Default to false for better performance
  containerClassName,
}) => {
  const interactiveRef = useRef(null);
  const [curX, setCurX] = useState(0);
  const [curY, setCurY] = useState(0);
  const [tgX, setTgX] = useState(0);
  const [tgY, setTgY] = useState(0);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!interactive) return;
    
    function move() {
      if (!interactiveRef.current) return;
      setCurX(curX + (tgX - curX) / 20);
      setCurY(curY + (tgY - curY) / 20);
      interactiveRef.current.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
    }
    move();
  }, [tgX, tgY, curX, curY, interactive]);

  const handleMouseMove = (event) => {
    if (!interactive || !interactiveRef.current) return;
    const rect = interactiveRef.current.getBoundingClientRect();
    setTgX(event.clientX - rect.left);
    setTgY(event.clientY - rect.top);
  };

  // Create gradient background style
  const backgroundStyle = {
    background: `linear-gradient(40deg, ${gradientBackgroundStart}, ${gradientBackgroundEnd})`
  };

  // Animation variants for 3 smaller circles with movement and color changes
  const circleVariants1 = {
    animate: {
      scale: [1, 1.2, 0.8, 1.1, 1],
      x: [0, 50, -30, 40, 0],
      y: [0, -60, 30, -20, 0],
      rotate: [0, 180, 360],
      transition: {
        duration: 45,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const circleVariants2 = {
    animate: {
      scale: [1, 0.9, 1.3, 0.95, 1],
      x: [0, -40, 60, -20, 0],
      y: [0, 50, -40, 70, 0],
      rotate: [360, 180, 0],
      transition: {
        duration: 50,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const circleVariants3 = {
    animate: {
      scale: [1, 1.1, 0.85, 1.15, 1],
      x: [0, 30, -50, 40, 0],
      y: [0, -30, 60, -50, 0],
      rotate: [0, 120, 240, 360],
      transition: {
        duration: 55,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Color animation states
  const [colorState1, setColorState1] = useState(0);
  const [colorState2, setColorState2] = useState(0);
  const [colorState3, setColorState3] = useState(0);

  // Color arrays for each circle
  const colors1 = [firstColor, secondColor, thirdColor];
  const colors2 = [secondColor, thirdColor, firstColor];
  const colors3 = [thirdColor, firstColor, secondColor];

  // Color cycling effect - Much slower and smoother
  useEffect(() => {
    const interval1 = setInterval(() => {
      setColorState1(prev => (prev + 1) % colors1.length);
    }, 45000); // Change color every 45 seconds

    const interval2 = setInterval(() => {
      setColorState2(prev => (prev + 1) % colors2.length);
    }, 60000); // Change color every 60 seconds

    const interval3 = setInterval(() => {
      setColorState3(prev => (prev + 1) % colors3.length);
    }, 75000); // Change color every 75 seconds

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
      clearInterval(interval3);
    };
  }, [colors1.length, colors2.length, colors3.length]);

  return (
    <div
      className={cn(
        "h-screen w-screen relative overflow-hidden top-0 left-0",
        containerClassName
      )}
      style={backgroundStyle}
      onMouseMove={handleMouseMove}
    >
      {/* SVG Filter for blur effects */}
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>



      <div className={cn("relative z-10", className)}>{children}</div>

      {/* Gradient container with blur */}
      <div
        className={cn(
          "gradients-container h-full w-full absolute inset-0",
          isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]"
        )}
      >
        {/* First circle - Top left area */}
        <motion.div
          variants={circleVariants1}
          animate="animate"
          className="absolute top-[20%] left-[15%] transition-all duration-[8000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle at center, rgba(${colors1[colorState1]}, 0.6) 0%, rgba(${colors1[colorState1]}, 0) 70%)`,
            mixBlendMode: blendingValue,
            width: "25vw",
            height: "25vw",
            opacity: 0.8
          }}
        />

        {/* Second circle - Top right area */}
        <motion.div
          variants={circleVariants2}
          animate="animate"
          className="absolute top-[15%] right-[20%] transition-all duration-[8000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle at center, rgba(${colors2[colorState2]}, 0.5) 0%, rgba(${colors2[colorState2]}, 0) 70%)`,
            mixBlendMode: blendingValue,
            width: "30vw",
            height: "30vw",
            opacity: 0.7
          }}
        />

        {/* Third circle - Bottom center area */}
        <motion.div
          variants={circleVariants3}
          animate="animate"
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 transition-all duration-[8000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle at center, rgba(${colors3[colorState3]}, 0.4) 0%, rgba(${colors3[colorState3]}, 0) 70%)`,
            mixBlendMode: blendingValue,
            width: "35vw",
            height: "35vw",
            opacity: 0.6
          }}
        />

        {/* Interactive pointer gradient (only when interactive is true) */}
        {interactive && (
          <div
            ref={interactiveRef}
            className="absolute opacity-50"
            style={{
              background: `radial-gradient(circle at center, rgba(${pointerColor}, 0.6) 0%, rgba(${pointerColor}, 0) 70%)`,
              mixBlendMode: blendingValue,
              width: "20vw",
              height: "20vw"
            }}
          />
        )}
      </div>
    </div>
  );
};