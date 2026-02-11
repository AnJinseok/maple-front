import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import SideMenu from "../sidebar/SideMenu";

/**
 * 공통 레이아웃(헤더/사이드/푸터)
 * - 입력: children(ReactNode)
 * - 출력: JSX(Element)
 */
export default function MainLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    return (
        <div className="app-layout">
            <Header />
            <div className={`main-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
                <SideMenu isOpen={sidebarOpen} onToggle={toggleSidebar} />
                <main className="content">
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
}
