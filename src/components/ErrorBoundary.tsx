import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 py-16 text-center text-neutral-900">
          <div className="max-w-md p-8 rounded-3xl bg-white border border-neutral-200 shadow-xl">
            <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-3">
              Royal Epic Interior
            </h2>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              We encountered a display issue loading this page. You can return to our catalog or refresh the page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/products"
                className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-medium text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all inline-block"
              >
                Browse Products
              </a>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-900 font-medium text-xs uppercase tracking-wider hover:bg-neutral-200 transition-all cursor-pointer"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
