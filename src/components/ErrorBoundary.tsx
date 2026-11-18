import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Terjadi kesalahan yang tidak terduga.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FCFAF7] px-4 py-12">
          <div className="max-w-md w-full bg-white border border-[#EAE3DA] rounded-2xl p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-[#1C1613] mb-3">
              Terjadi Gangguan Sistem
            </h2>
            <p className="text-sm text-[#6E5E55] mb-6 leading-relaxed">
              Mohon maaf, Dapur Aziz mengalami kendala saat memuat halaman.
              Silakan muat ulang halaman untuk melanjutkan.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-[#C82319] text-white text-sm font-semibold hover:bg-[#A61B13] transition-colors cursor-pointer"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
