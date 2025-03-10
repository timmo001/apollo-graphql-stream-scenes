import { FaTwitch } from "react-icons/fa";

import useCurrentViewers from "../hooks/current-viewer-count";

export default function OrbitScene() {
  const userCount = useCurrentViewers();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        padding: 16,
        fontSize: "3rem",
        fontFamily: "Source Sans Pro",
        fontWeight: 700,
      }}
    >
      {typeof userCount !== "undefined" && (
        <h1 style={{ display: "flex", alignItems: "flex-start" }}>
          <FaTwitch style={{ marginRight: 8, marginTop: 3 }} /> {userCount}
        </h1>
      )}
    </div>
  );
}
