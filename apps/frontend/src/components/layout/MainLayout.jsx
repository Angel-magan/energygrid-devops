import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  return (
    // .main-layout -> Contenedor flex principal que ocupa toda la pantalla y fija el color de fondo profundo
    <div className="flex min-h-screen bg-grid-deep text-grid-text font-sans antialiased overflow-x-hidden">
      {/* COMPONENTE SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      {/* .main-content -> Contenedor flexible derecho que se expande automáticamente */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* COMPONENTE TOPBAR */}
        <Topbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* .page-content -> Área interna de scroll donde se renderizará el Dashboard */}
        <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] w-full mx-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
