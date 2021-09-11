import { FaTwitch } from "react-icons/fa";

import canvasBg from "../../images/canvas-bg.png";
import titleBg from "../../images/title-bg.png";
import useChannel from "../../hooks/channel";
import useCurrentViewers from "../../hooks/current-viewer-count";

export interface SceneProps {
  path: string;
}

export default function Scene(_: SceneProps) {
  const channel = useChannel();
  const userCount = useCurrentViewers();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#311C87",
        backgroundImage: `URL(${canvasBg})`,
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-start",
          height: "100%",
        }}
      >
        <div
          style={{
            width: "100%",
            paddingLeft: "2rem",
            paddingRight: "2rem",
            height: "18%",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            marginTop: "auto",
            backgroundColor: "#311C87",
            backgroundImage: `URL(${titleBg})`,
            color: "#ffffff",
            borderTop: "5px solid #3F20BA",
          }}
        >
          <div
            style={{
              width: "40%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "stretch",
              paddingTop: ".8rem",
              paddingBottom: ".8rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <h1
                style={{
                  fontFamily: "Source Sans Pro",
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
                {channel?.currentStream
                  ? channel.currentStream.title
                  : "Your title here"}
              </h1>
              {channel?.currentStream?.streamers.length > 0 && (
                <h2
                  style={{
                    fontFamily: "Source Code Pro",
                    fontWeight: 600,
                    letterSpacing: 1.2,
                    fontSize: 24,
                  }}
                >
                  {channel.currentStream.streamers.join(" / ")}
                </h2>
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            width: "100%",
            paddingTop: 2,
            paddingBottom: 2,
            backgroundColor: "#3F20BA",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingLeft: "2rem",
            }}
          >
            {typeof userCount !== "undefined" && (
              <h5
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  fontSize: "1.2rem",
                  fontFamily: "Source Sans Pro",
                  fontWeight: 700,
                  paddingRight: 8,
                  marginRight: 6,
                  borderRight: "2px solid #311C87",
                }}
              >
                <FaTwitch style={{ marginRight: 4, marginTop: 3 }} />{" "}
                {userCount}
              </h5>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
