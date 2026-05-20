import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo?: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, info);
    this.setState({ errorInfo: error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-hero flex flex-col items-center justify-center text-cream">
          <h1 className="text-4xl mb-4">Something went wrong.</h1>
          <p className="mb-6">{this.state.errorInfo || 'Please try reloading the page.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-bronze text-white rounded hover:bg-bronze/80 transition"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
