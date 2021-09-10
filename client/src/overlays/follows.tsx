import { SceneProps } from "../components/scene";
import Follow from "../components/follow";

export default function NewFollowers(_: SceneProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Follow />
    </div>
  );
}
