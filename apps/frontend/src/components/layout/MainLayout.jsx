import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isAuthenticated = Boolean(localStorage.getItem("eg_auth_token"));
  let userRoles = [];
  try {
    const stored = localStorage.getItem("eg_auth_user");
    userRoles = stored ? JSON.parse(stored).roles || [] : [];
  } catch (e) {
    userRoles = [];
  }
  const isAdmin = userRoles.includes("admin");

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);
  const handleLogout = () => {
    localStorage.removeItem("eg_auth_token");
    localStorage.removeItem("eg_auth_user");
    // Redirect to dashboard (root) after logout instead of login page
    window.location.assign("/");
  };

  return (
    <div className="flex min-h-screen bg-grid-deep text-grid-text font-sans antialiased overflow-x-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
      />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Topbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
        />
        <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] w-full mx-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
