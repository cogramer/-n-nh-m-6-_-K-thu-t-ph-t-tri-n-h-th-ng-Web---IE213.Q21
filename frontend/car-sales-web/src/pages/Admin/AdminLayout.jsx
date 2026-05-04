import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  Menu,
  X,
  LayoutDashboard,
  MessageSquareText,
  ShoppingBag,
  Package,
  LogOut
} from "lucide-react";
import "./AdminLayout.css";

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Check whether a link is active to highlight the menu
  const isActive = (path) => location.pathname === path;

  // Close the menu after a link click
  const handleMenuItemClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`admin-container ${isCollapsed ? "sidebar-collapsed" : ""} ${isMobileMenuOpen ? "mobile-menu-open" : ""}`}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          {!isCollapsed && <span className="brand-name">CAR ADMIN</span>}
          <button
            className="toggle-btn desktop-only"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            className="toggle-btn mobile-only"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link 
                to="/admin" 
                className={isActive("/admin") ? "active" : ""}
                onClick={handleMenuItemClick}
              >
                <LayoutDashboard size={20} />
                <span>Thống kê chung</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/orders" 
                className={isActive("/admin/orders") ? "active" : ""}
                onClick={handleMenuItemClick}
              >
                <ShoppingBag size={20} />
                <span>Quản lý đơn hàng</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/contacts" 
                className={isActive("/admin/contacts") ? "active" : ""}
                onClick={handleMenuItemClick}
              >
                <MessageSquareText size={20} />
                <span>Quản lý liên hệ</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/products" 
                className={isActive("/admin/products") ? "active" : ""}
                onClick={handleMenuItemClick}
              >
                <Package size={20} />
                <span>Quản lý sản phẩm</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" onClick={handleMenuItemClick}>
            <LogOut size={20} />
            <span>Thoát Admin</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <header className="main-header">
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
          <div className="breadcrumb">
            Admin / {location.pathname.split("/").pop() || "Dashboard"}
          </div>
        </header>
        <div className="admin-content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
