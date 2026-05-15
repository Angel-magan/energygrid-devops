import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={`main-layout ${isSidebarOpen ? "" : "sidebar-closed"}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      <div className="main-content">
        <Topbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />

        <div className="page-content">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
