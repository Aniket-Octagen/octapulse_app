// In your header/topbar component
import Notification from "./Notification";

export default function Topbar() {
  return (
    <div className="flex items-center justify-between p-3 bg-white shadow">
      <div className="font-semibold" style={{ color: "#2c6a36" }}>Theta Deviation Dashboard</div>
      <div className="flex items-center gap-3">
        <Notification />
      </div>
    </div>
  );
}
