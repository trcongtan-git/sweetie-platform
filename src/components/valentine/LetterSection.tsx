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

  useEffect(() => {
    if (isEnvelopeOpen) {
      const timer = setTimeout(() => {
        setIsLetterPoppedUp(true);
      }, 2000); 
      return () => clearTimeout(timer);
    } else {
      setIsLetterPoppedUp(false);
    }
  }, [isEnvelopeOpen]);

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
    setIsLetterUnfolded(true);
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

              {/* The Letter Paper (Inner - Folded State Only) */}
              <motion.div
                className="absolute left-4 right-4 bg-white p-4 shadow-sm overflow-hidden font-serif cursor-pointer hover:bg-gray-50 transition-colors"
                initial={{ y: 0, zIndex: 10 }}
                animate={{ 
                  y: isLetterPoppedUp ? (isLetterUnfolded ? 120 : [0, -200, 40]) : 0,
                  zIndex: isLetterPoppedUp ? (isLetterUnfolded ? 20 : 40) : 10,
                  z: isLetterPoppedUp ? (isLetterUnfolded ? 0 : 10) : 0,
                  height: 160,
                }}
                whileHover={isEnvelopeOpen ? { y: 20 } : {}}
                transition={{ 
                  y: { duration: isLetterUnfolded ? 0.5 : 1.5, times: [0, 0.4, 1], ease: "easeInOut" },
                  zIndex: { delay: isLetterPoppedUp ? 0.6 : 0 },
                  z: { delay: isLetterPoppedUp ? 0.6 : 0 },
                  default: { duration: 0.5 }
                }}
                onClick={handleLetterClick}
              >
                  <div className="w-full h-full flex items-center justify-center opacity-70 text-sm tracking-widest text-pink-500 font-bold uppercase animate-pulse text-center">
                     {isEnvelopeOpen ? "Happy Valentine của đôi ta" : ""}
                  </div>
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
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-[#d97c91] drop-shadow-md"
                animate={{ 
                  opacity: isEnvelopeOpen ? 0 : 1,
                  scale: isEnvelopeOpen ? 0 : 1
                }}
              >
                 <Heart fill="currentColor" size={44} strokeWidth={0} />
              </motion.div>



        </motion.div>
      </motion.div>
    </div>

      {/* Full Screen Letter Overlay - Ensures it's on top of everything */}
      <AnimatePresence>
      {isLetterUnfolded && (
        <motion.div 
           className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={() => setIsLetterUnfolded(false)}
        >
          <motion.div 
            className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full font-serif relative"
            initial={{ scale: 0.5, y: 100, rotate: -5 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.5, y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
             <div className="absolute top-4 right-4 text-gray-400 cursor-pointer hover:text-pink-500" onClick={() => setIsLetterUnfolded(false)}>✕</div>
             <div className="h-full flex flex-col items-center text-gray-800">
               <h3 className="text-2xl font-bold text-pink-600 mb-6 font-cursive text-center">Gửi người thương,</h3>
               <div className="text-base leading-relaxed space-y-4 text-justify">
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
               <div className="mt-10 w-full text-right font-bold text-pink-500 font-cursive text-xl">
                 - From [Tên Bạn] -
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

       <div className="absolute bottom-10 text-pink-400 text-xs animate-bounce opacity-70">
          {isLetterUnfolded ? "Chạm vào vùng trống để đóng lại" : "Chạm vào phong thư để mở"}
       </div>
    </section>
  );
};

export default LetterSection;
