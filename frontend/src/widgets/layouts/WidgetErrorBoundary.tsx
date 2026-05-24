import { Component, type ReactNode } from 'react';

interface Props {
  children:  ReactNode;
  widgetId:  string;
  widgetName?: string;
}

interface State {
  hasError: boolean;
  error:    string | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[80px] flex-col items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">
          <p className="text-xs font-semibold text-red-400">
            Widget &ldquo;{this.props.widgetName ?? this.props.widgetId}&rdquo; — Erreur
          </p>
          {this.state.error && (
            <p className="mt-1 max-w-xs truncate text-[10px] text-red-300/70">{this.state.error}</p>
          )}
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 rounded px-2 py-0.5 text-[10px] text-red-400 underline hover:text-red-300"
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
