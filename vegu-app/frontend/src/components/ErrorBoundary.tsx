'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  portal?: 'customer' | 'admin' | 'rider';
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[VEGU ErrorBoundary]', { portal: this.props.portal, error: error.message, stack: info.componentStack });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    const homeHref = this.props.portal === 'rider' ? '/rider' : this.props.portal === 'admin' ? '/admin' : '/';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-gray-100">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 text-sm mb-6">
            {this.state.error.message || 'An unexpected error occurred. Our team has been notified.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
            <a
              href={homeHref}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
