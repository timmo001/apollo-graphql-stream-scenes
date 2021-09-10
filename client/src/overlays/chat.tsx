import { SceneProps } from "../components/scene";
import Chat from "../components/chat";

export default function ChatOverlay(_: SceneProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Chat />
    </div>
  );
}
