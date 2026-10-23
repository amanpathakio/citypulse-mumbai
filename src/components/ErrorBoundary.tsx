import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-4 bg-white border border-rose-200 rounded-lg shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {this.props.fallbackTitle || 'Component Encountered an Issue'}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {this.state.error?.message || 'An unexpected rendering error occurred. The system is active.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-slate-900 hover:bg-slate-800 text-white inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
