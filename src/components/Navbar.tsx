import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  LogOut,
  Menu,
  ShoppingBag,
  ShieldCheck,
  User as UserIcon,
  ClipboardList,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';

export function Navbar() {
  const { user, profile, isAdmin, openAuthModal, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname]);

  const handleNavSection = (hash: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    await logout();
    if (location.pathname === '/admin' || location.pathname === '/pesanan' || location.pathname === '/profil') {
      navigate('/');
    }
  };

  const displayName =
    profile?.nama_lengkap ||
    (user?.user_metadata?.nama_lengkap as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Akun';

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-sm border-b border-[#EAE3DA]">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <Link
          to="/"
          className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#1C1613] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C82319] rounded"
        >
          Dapur Aziz
        </Link>

        {/* Zone 2: Clean single-line nav links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#574941]"
        >
          <button
            type="button"
            onClick={() => handleNavSection('katalog-menu')}
            className="hover:text-[#C82319] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1"
          >
            Menu
          </button>
          <button
            type="button"
            onClick={() => handleNavSection('tentang-kami')}
            className="hover:text-[#C82319] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1"
          >
            Tentang Kami
          </button>
          {user && (
            <Link
              to="/pesanan"
              className={`hover:text-[#C82319] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1 ${
                location.pathname === '/pesanan'
                  ? 'text-[#C82319] font-semibold'
                  : ''
              }`}
            >
              Pesanan Saya
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className={`hover:text-[#C82319] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1 ${
                location.pathname === '/admin'
                  ? 'text-[#C82319] font-semibold'
                  : ''
              }`}
            >
              Dashboard Admin
            </Link>
          )}
        </nav>

        {/* Zone 3: Cart & Account Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={openCart}
            aria-label={`Buka keranjang belanja (${totalItems} item)`}
            className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-lg border border-[#E2D8CC] bg-[#FCFAF7] hover:border-[#C82319] text-[#1C1613] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C82319]"
          >
            <ShoppingBag className="w-4 h-4 text-[#C82319]" aria-hidden="true" />
            <span className="hidden sm:inline">Keranjang</span>
            <span className="tabular-nums text-xs font-bold px-1.5 py-0.5 rounded bg-[#D97706] text-white min-w-[20px] text-center">
              {totalItems}
            </span>
          </button>

          {user ? (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-lg bg-[#1C1613] hover:bg-[#332924] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
              >
                <UserIcon className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
                <span className="max-w-[130px] truncate">{displayName}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#EAE3DA] shadow-lg py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-[#F1EBE3]">
                    <p className="text-sm font-semibold text-[#1C1613] truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-[#6E5E55] truncate">
                      {profile?.email || user.email}
                    </p>
                  </div>

                  <Link
                    to="/profil"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#3E332D] hover:bg-[#FCFAF7] hover:text-[#C82319] transition-colors"
                  >
                    <UserIcon className="w-4 h-4" aria-hidden="true" />
                    <span>Profil Saya</span>
                  </Link>

                  <Link
                    to="/pesanan"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#3E332D] hover:bg-[#FCFAF7] hover:text-[#C82319] transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" aria-hidden="true" />
                    <span>Pesanan Saya</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#B91C1C] font-medium hover:bg-[#FEF2F2] transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      <span>Dashboard Admin</span>
                    </Link>
                  )}

                  <div className="border-t border-[#F1EBE3] mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#6E5E55] hover:bg-[#FCFAF7] hover:text-[#B91C1C] transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="hidden md:inline-flex items-center px-4 py-2 min-h-[40px] rounded-lg bg-[#C82319] hover:bg-[#A61B13] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
            >
              Masuk
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#E2D8CC] text-[#1C1613] hover:bg-[#FCFAF7] cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#EAE3DA] px-4 py-4 space-y-2 shadow-md">
          <button
            type="button"
            onClick={() => handleNavSection('katalog-menu')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#1C1613] hover:bg-[#FCFAF7] cursor-pointer"
          >
            Menu Katalog
          </button>
          <button
            type="button"
            onClick={() => handleNavSection('tentang-kami')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#1C1613] hover:bg-[#FCFAF7] cursor-pointer"
          >
            Tentang Kami
          </button>

          {user ? (
            <>
              <Link
                to="/pesanan"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#1C1613] hover:bg-[#FCFAF7]"
              >
                Pesanan Saya
              </Link>
              <Link
                to="/profil"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#1C1613] hover:bg-[#FCFAF7]"
              >
                Profil Saya ({displayName})
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-[#C82319] hover:bg-[#FEF2F2]"
                >
                  Dashboard Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#6E5E55] hover:bg-[#FCFAF7] cursor-pointer"
              >
                Keluar
              </button>
            </>
          ) : (
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#C82319] text-white text-sm font-semibold cursor-pointer"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('register');
                }}
                className="flex-1 py-2.5 rounded-lg border border-[#E2D8CC] text-[#1C1613] text-sm font-semibold cursor-pointer"
              >
                Daftar
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
