import { SceneProps } from "../components/scene";
import canvasBg from "../images/canvas-bg.png";

export default function BrbScene(_: SceneProps) {
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
            height: "100%",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          <div
            style={{
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
                color: "#ffffff",
              }}
            >
              <h1
                style={{
                  fontFamily: "Source Sans Pro",
                  fontSize: "7.5rem",
                  fontWeight: 800,
                  marginBottom: 32,
                  textTransform: "uppercase",
                }}
              >
                Be Right Back.
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
