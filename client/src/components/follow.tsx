import { useEffect, useState, useRef } from "react";
import useSound from "use-sound";
import { motion, AnimatePresence } from "framer-motion";

import followImg from "../images/follow.gif";
import followSound from "../sounds/pixie.mp3";
import useFollows from "../hooks/follows";

export default function NewFollowers() {
  const follower = useFollows();
  const [current, setCurrent] = useState(follower);
  const [stale, setStale] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.8);
  const [play] = useSound(followSound, { playbackRate, volume: 0.5 });
  const timeout = useRef<any>();

  useEffect(() => {
    if (current !== follower) {
      clearTimeout(timeout.current);

      setStale(false);
      setCurrent(follower);
      play();
      setPlaybackRate(playbackRate + 0.1);

      timeout.current = setTimeout(() => {
        setStale(true);
        setPlaybackRate(0.8);
      }, 4000);
    }
  }, [follower, current, play, playbackRate, stale, setStale, setCurrent]);

  return (
    <div
      style={{
        width: 250,
        height: 75,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 4,
      }}
    >
      <AnimatePresence>
        {!stale && current && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#ffffff",
              borderRadius: 4,
              boxShadow: "3px 3px 4px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ paddingLeft: 4, width: "25%", maxWidth: 100 }}>
              <img
                src={followImg}
                style={{ width: "100%", objectFit: "cover" }}
                alt="astronaut illustration"
              />
            </div>
            <div
              style={{
                width: "75%",
                marginLeft: 8,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontFamily: "Source Sans Pro",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 2,
                  fontSize: "80%",
                }}
              >
                New Follower!
              </span>
              <span
                style={{
                  fontFamily: "Source Sans Pro",
                  fontWeight: 800,
                }}
              >
                {current}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
