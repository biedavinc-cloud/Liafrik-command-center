import React from 'react';
import { useLocation } from 'react-router-dom';

class Boundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('UI error:', error, info?.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <h2 className="text-base font-semibold">Something went wrong on this page</h2>
          <p className="mt-2 text-sm text-muted-foreground break-words">{String(this.state.error?.message || this.state.error)}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button className="rounded-md border border-border px-3 py-1.5 text-sm" onClick={() => this.setState({ error: null })}>Try again</button>
            <button className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground" onClick={() => { window.location.href = '/'; }}>Go to Overview</button>
          </div>
        </div>
      </div>
    );
  }
}

// Resets automatically when the route changes so one broken page never blocks navigation.
export default function ErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <Boundary key={pathname}>{children}</Boundary>;
}
