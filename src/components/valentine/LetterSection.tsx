'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';


const LetterSection = () => {
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [isLetterUnfolded, setIsLetterUnfolded] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isLetterPoppedUp, setIsLetterPoppedUp] = useState(false);
  const [hasAnimatedOut, setHasAnimatedOut] = useState(false);

  useEffect(() => {
    if (isEnvelopeOpen) {
      const timer = setTimeout(() => {
        setIsLetterPoppedUp(true);
      }, 2000); 
      return () => clearTimeout(timer);
    } else {
      setIsLetterPoppedUp(false);
      setHasAnimatedOut(false);
    }
  }, [isEnvelopeOpen]);

  // Mark animation as completed so closing popup doesn't re-trigger keyframes
  useEffect(() => {
    if (isLetterPoppedUp) {
      const timer = setTimeout(() => {
        setHasAnimatedOut(true);
      }, 1600); // slightly after the 1.5s animation
      return () => clearTimeout(timer);
    }
  }, [isLetterPoppedUp]);

  const handleEnvelopeClick = () => {
    if (!isEnvelopeOpen) {
      setIsEnvelopeOpen(true);
    } else if (isLetterUnfolded) {
      setIsLetterUnfolded(false);
      setTimeout(() => setIsEnvelopeOpen(false), 800);
    }
  };

  const handleLetterClick = (e: React.MouseEvent) => {
    
    // If closed, let the click bubble up to the wrapper to open the envelope
    if (!isEnvelopeOpen) {
       return; 
    }

    e.stopPropagation();
    setIsLetterUnfolded(!isLetterUnfolded);
  };

  return (
    <section 
      id="letter-section" 
      className="min-h-screen relative flex items-center justify-center bg-[#f8d5d3] overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      <div className="relative flex flex-col items-center justify-center gap-8">
        
        {/* Floating Hearts (Decorative) - Top */}
        <div className="absolute -top-24 flex gap-6 z-0">
          {[
            { color: "text-[#ef98a5]", rotate: -15, y: 0 },
            { color: "text-[#ef6080]", rotate: 0, y: -20 },
            { color: "text-[#ef98a5]", rotate: 15, y: 0 },
          ].map((item, i) => (
            <motion.div
              key={`top-${i}`}
              initial={{ y: 80, opacity: 0, scale: 0 }}
              animate={showHearts ? { y: item.y, opacity: 1, scale: 1, rotate: item.rotate } : {}}
              transition={{ 
                duration: 0.8, 
                delay: i * 0.1,
                type: "spring",
                bounce: 0.5
              }}
            >
              <Heart className={item.color} fill="currentColor" size={i === 1 ? 64 : 54} />
            </motion.div>
          ))}
        </div>

        {/* Floating Hearts (Decorative) - Bottom */}
        <div className="absolute -bottom-24 flex gap-6 z-0">
           {[
            { color: "text-[#ef98a5]", rotate: -15, y: 0 },
            { color: "text-[#ef6080]", rotate: 0, y: 20 },
            { color: "text-[#ef98a5]", rotate: 15, y: 0 },
          ].map((item, i) => (
            <motion.div
              key={`bottom-${i}`}
              initial={{ y: -80, opacity: 0, scale: 0 }}
              animate={showHearts ? { y: item.y, opacity: 1, scale: 1, rotate: item.rotate } : {}}
              transition={{ 
                duration: 0.8, 
                delay: i * 0.1, 
                type: "spring",
                bounce: 0.5
              }}
            >
              <Heart className={item.color} fill="currentColor" size={i === 1 ? 64 : 54} />
            </motion.div>
          ))}
        </div>

        {/* Envelope Wrapper (Trigger) */}
        <motion.div
          className="relative w-80 h-48 z-10"
          viewport={{ once: false, amount: 0.2 }}
          onViewportEnter={() => setIsInView(true)}
          onViewportLeave={() => {
            setIsInView(false);
            setIsEnvelopeOpen(false);
            setIsLetterUnfolded(false);
            setShowHearts(false);
          }}
        >
          <motion.div 
            className="w-full h-full cursor-pointer"
            animate={isInView ? "animate" : "initial"}
            variants={{
              initial: { x: -400, opacity: 0, rotate: -20, rotateY: 50 },
              animate: { x: 0, opacity: 1, rotate: 0, rotateY: 0 }
            }}
            transition={{ 
              x: { duration: 2.5, type: "spring", bounce: 0.2 },
              opacity: { duration: 1.5 },
              rotate: { duration: 2.5, ease: "easeOut" },
              rotateY: { duration: 2.5, ease: "easeOut" }
            }}
            onClick={handleEnvelopeClick}
            onAnimationComplete={(definition) => {
               // Check completeness of entrance animation
               if (definition === 'animate') { 
                 setTimeout(() => {
                    setShowHearts(true);
                 }, 500);
               }
            }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Envelope Body (Back) */}
            <div className="absolute inset-0 bg-[#f1a7b7] rounded-md" />
            
            {/* Border Overlay (Ensures edges are visible) */}
            <div className="absolute inset-0 border-2 border-[#b2627b] rounded-md pointer-events-none" />

              {/* The Letter Paper (Inner) */}
              <motion.div
                className="absolute left-4 right-4 cursor-pointer"
                initial={{ y: 0, zIndex: 10 }}
                animate={{ 
                  y: isLetterPoppedUp ? (isLetterUnfolded ? -180 : (hasAnimatedOut ? 40 : [0, -200, 40])) : 0,
                  zIndex: isLetterPoppedUp ? 40 : 10,
                  z: isLetterPoppedUp ? 10 : 0,
                  rotate: isLetterPoppedUp ? (isLetterUnfolded ? 2 : (hasAnimatedOut ? 3 : [0, -5, 3])) : 0,
                  scale: isLetterUnfolded ? 1.3 : 1,
                }}
                whileHover={isEnvelopeOpen && !isLetterUnfolded ? { y: 20, rotate: 0 } : {}}
                transition={{ 
                  y: { duration: hasAnimatedOut ? 0.5 : 1.5, times: hasAnimatedOut ? undefined : [0, 0.4, 1], ease: "easeInOut" },
                  rotate: { duration: hasAnimatedOut ? 0.5 : 1.5, times: hasAnimatedOut ? undefined : [0, 0.4, 1], ease: "easeInOut" },
                  zIndex: { delay: isLetterPoppedUp ? 0.6 : 0 },
                  z: { delay: isLetterPoppedUp ? 0.6 : 0 },
                  default: { duration: 0.5 }
                }}
                onClick={handleLetterClick}
                style={{ perspective: "800px" }}
              >
                  {/* Full Letter Content - clipped when folded */}
                  <motion.div 
                    className="relative w-full bg-white rounded-sm shadow-md overflow-hidden font-serif"
                    animate={{ height: isLetterUnfolded ? 320 : 160 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {/* Full letter content (always in DOM, revealed by fold cover lifting) */}
                    <div className="px-5 py-4 text-gray-800 h-[320px]">
                      <h3 className="text-base font-bold text-pink-600 mb-3 font-cursive text-center">Gửi người thương,</h3>
                      <div className="text-xs leading-relaxed space-y-2 text-justify">
                        <p>
                          Ngày Valentine này, anh muốn gửi đến em những lời yêu thương chân thành nhất. Cảm ơn em đã đến bên anh và mang lại cho anh những nụ cười hạnh phúc.
                        </p>
                        <p>
                          Mỗi ngày bên em đều là một ngày đặc biệt. Mong rằng chúng ta sẽ cùng nhau viết tiếp những trang sách tuyệt vời của cuộc đời mình.
                        </p>
                        <p>
                          Yêu em nhiều hơn những gì anh có thể nói.
                        </p>
                      </div>
                      <div className="mt-3 w-full text-right font-bold text-pink-500 font-cursive text-sm">
                        - From [Tên Bạn] -
                      </div>
                    </div>
                  </motion.div>

                  {/* Fold Cover - physically covers top half, flips down to reveal content */}
                  <motion.div 
                    className="absolute top-0 left-0 right-0 h-[160px] bg-white rounded-t-sm shadow-sm overflow-hidden font-serif"
                    initial={{ rotateX: 0 }}
                    animate={{ 
                      rotateX: isLetterUnfolded ? 180 : 0,
                    }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    style={{ 
                      transformOrigin: "bottom center",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    {/* Label on fold cover - goes with it when it flips */}
                    <div className="absolute inset-0 flex items-center justify-center text-sm tracking-widest text-pink-500 font-bold uppercase text-center">
                      {isEnvelopeOpen ? "Happy Valentine của đôi ta" : ""}
                    </div>
                    {/* Fold line decoration */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-pink-200/50" />
                  </motion.div>
              </motion.div>
            {/* Envelope Flap (Top) */}
            <motion.div 
              className="absolute top-0 left-0 w-0 h-0 border-l-[160px] border-r-[160px] border-t-[105px] border-l-transparent border-r-transparent border-t-[#f1a7b7] origin-top drop-shadow-[0_2px_0_#b2627b] pointer-events-none"
              initial={{ zIndex: 40 }}
              animate={{ 
                rotateX: isEnvelopeOpen ? 180 : 0,
                zIndex: isEnvelopeOpen ? 0 : 40
              }}
              transition={{ duration: 0.6 }}
            />

            {/* Left Flap */}
            <div 
              className="absolute top-0 left-0 w-0 h-0 border-l-[160px] border-t-[96px] border-b-[96px] border-t-transparent border-b-transparent border-l-[#f1a7b7] z-30 drop-shadow-[1px_0_0_#b2627b] pointer-events-none" 
              style={{ transform: "translateZ(2px)" }}
            />
            
            {/* Right Flap */}
            <div 
              className="absolute top-0 right-0 w-0 h-0 border-r-[160px] border-t-[96px] border-b-[96px] border-t-transparent border-b-transparent border-r-[#f1a7b7] z-30 drop-shadow-[-1px_0_0_#b2627b] pointer-events-none" 
              style={{ transform: "translateZ(2px)" }}
            />

            {/* Bottom Flap */}
            <div 
              className="absolute bottom-0 left-0 w-0 h-0 border-b-[105px] border-l-[160px] border-r-[160px] border-l-transparent border-r-transparent border-b-[#f1a7b7] z-30 drop-shadow-[0_-1px_0_#b2627b] pointer-events-none" 
              style={{ transform: "translateZ(2px)" }}
            />
              

              
              {/* Heart Seal */}
              <motion.div
                className="absolute top-1/2 left-1/2 z-50 text-[#d97c91] drop-shadow-md"
                initial={{ x: "-50%", y: "-50%", z: 3, opacity: 1, scale: 1 }}
                animate={{ 
                  x: "-50%",
                  y: "-50%",
                  z: 3,
                  opacity: isEnvelopeOpen ? 0 : 1,
                  scale: isEnvelopeOpen ? 0 : 1
                }}
              >
                 <Heart fill="currentColor" size={44} strokeWidth={0} />
              </motion.div>



        </motion.div>
      </motion.div>
    </div>

       <div className="absolute bottom-10 text-pink-400 text-xs animate-bounce opacity-70">
          {isLetterUnfolded ? "Chạm vào lá thư để gấp lại" : "Chạm vào phong thư để mở"}
       </div>
    </section>
  );
};

export default LetterSection;
