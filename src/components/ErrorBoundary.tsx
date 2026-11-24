import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Top-level React error boundary to prevent white-screen crashes and give
 * users a clear recovery path.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Kesalahan tidak terduga pada tampilan.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Pandu ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/30 shadow-md">
          <CardHeader>
            <div className="size-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <AlertTriangle className="size-5" />
            </div>
            <CardTitle className="text-lg">Terjadi Kesalahan Tampilan</CardTitle>
            <CardDescription>
              Aplikasi mengalami kendala tak terduga. Data lokal Anda tetap aman di browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-muted border text-xs font-mono text-muted-foreground break-words">
              {this.state.errorMessage}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={this.handleReset} className="flex-1">
                Coba Lagi
              </Button>
              <Button onClick={this.handleReload} className="flex-1">
                <RefreshCw className="size-3.5" /> Muat Ulang
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
