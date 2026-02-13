"use client";

import React, { useState } from "react";
import Typewriter from "typewriter-effect";
import { scroller } from "react-scroll";
import { motion } from "framer-motion";

const IntroSection = ({ onComplete }: { onComplete: () => void }) => {
  const [loopCount, setLoopCount] = useState(0);

  const handleTypewriterInit = (typewriter: any) => {
    typewriter
      .typeString("Chào em, cô gái tháng 2...")
      .pauseFor(1500)
      .deleteAll()
      .typeString("Anh có điều này muốn nói...")
      .pauseFor(1500)
      .deleteAll()
      .typeString("Em nhớ giữ bí mật nhé!")
      .pauseFor(1500)
      .deleteAll()
      .callFunction(() => {
        setLoopCount((prev) => prev + 1);
      })
      .start();
  };

  // Check if loop count reaches 1, then scroll
  React.useEffect(() => {
    if (loopCount >= 1) {
      const timer = setTimeout(() => {
        onComplete(); // Unlock scroll
        scroller.scrollTo("letter-section", {
          duration: 1500,
          delay: 100,
          smooth: "easeInOutQuart",
          containerId: "valentine-container",
        });
      }, 3000); // Wait 3 seconds before scrolling

      return () => clearTimeout(timer);
    }
  }, [loopCount]);

  return (
    <section
      id="intro-section"
      className="h-screen flex flex-col items-center justify-center bg-black text-white p-6"
    >
      <div className="text-2xl md:text-4xl font-light tracking-wider text-center font-mono text-pink-200">
        {loopCount < 1 ? (
          <Typewriter
            key={loopCount} // Remount to restart
            onInit={handleTypewriterInit}
            options={{
              delay: 50,
              cursor: "❤️",
            }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            ❤️
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default IntroSection;
