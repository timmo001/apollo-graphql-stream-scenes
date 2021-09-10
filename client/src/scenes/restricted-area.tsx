import { SceneProps } from "../components/scene";
import canvasBg from "../images/canvas-bg.png";

export default function MissionBriefingScene(_: SceneProps) {
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
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <h1
          style={{
            fontFamily: "Source Sans Pro",
            fontSize: "7.5rem",
            fontWeight: 800,
            textTransform: "uppercase",
            color: "#ffffff",
          }}
        >
          Restricted Area
        </h1>
      </div>
    </div>
  );
}
