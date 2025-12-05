/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 */

import { Component, ErrorInfo, ReactNode } from "react";
import { Container, Paper, Title, Text, Button, Stack, Code } from "@mantine/core";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
        
        // In production, you would log this to an error tracking service
        // Example: Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <Container size="sm" py="xl">
                    <Paper p="xl" withBorder shadow="md">
                        <Stack spacing="md">
                            <Title order={2} color="red">
                                Something went wrong
                            </Title>
                            
                            <Text color="dimmed">
                                An unexpected error occurred in the application. 
                                This has been logged and we'll look into it.
                            </Text>

                            {this.state.error && (
                                <Paper p="sm" withBorder bg="gray.0">
                                    <Text size="sm" weight={500} mb="xs">
                                        Error Details:
                                    </Text>
                                    <Code block color="red">
                                        {this.state.error.message}
                                    </Code>
                                </Paper>
                            )}

                            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                                <Paper p="sm" withBorder bg="gray.0">
                                    <Text size="sm" weight={500} mb="xs">
                                        Component Stack:
                                    </Text>
                                    <Code block style={{ whiteSpace: "pre-wrap", fontSize: "11px" }}>
                                        {this.state.errorInfo.componentStack}
                                    </Code>
                                </Paper>
                            )}

                            <div style={{ display: "flex", gap: "12px" }}>
                                <Button onClick={this.handleReset} variant="outline">
                                    Try Again
                                </Button>
                                <Button onClick={this.handleReload}>
                                    Reload Page
                                </Button>
                            </div>
                        </Stack>
                    </Paper>
                </Container>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook-style error boundary wrapper for functional components
 * Usage: <ErrorBoundaryWrapper><YourComponent /></ErrorBoundaryWrapper>
 */
export const ErrorBoundaryWrapper = ({ children, fallback }: Props) => {
    return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
};

export default ErrorBoundary;

