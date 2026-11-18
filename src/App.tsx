import React from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { AuthModal } from './components/AuthModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Navbar } from './components/Navbar.tsx';
import { RatingModal } from './components/RatingModal.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { MenuProvider } from './context/MenuContext.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { OrdersPage } from './pages/OrdersPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-[#6E5E55]">
        Memeriksa hak akses administrator...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function Footer() {
  return (
    <footer className="border-t border-[#EAE3DA] bg-[#FCFAF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E5E55]">
        <p>© {new Date().getFullYear()} Dapur Aziz. Hidangan lalapan &amp; minuman segar.</p>
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-[#C82319] transition-colors">
            Katalog Menu
          </Link>
          <Link to="/pesanan" className="hover:text-[#C82319] transition-colors">
            Pesanan Saya
          </Link>
          <Link to="/profil" className="hover:text-[#C82319] transition-colors">
            Profil
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <MenuProvider>
            <CartProvider>
              <div className="min-h-screen flex flex-col bg-[#FCFAF7] text-[#1C1613]">
                <Navbar />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/pesanan" element={<OrdersPage />} />
                    <Route path="/profil" element={<ProfilePage />} />
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminPage />
                        </AdminRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
                <Footer />
                <AuthModal />
                <CartDrawer />
                <RatingModal />
              </div>
            </CartProvider>
          </MenuProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
