import { Button, Container, Title, Stack } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const HomePage = () => {
    const navigate = useNavigate();
    const { loginWithGoogle, user } = useAuth();

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
            navigate("/schedule");
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const handleSignup = async () => {
        // Signup is the same as login with Google
        await handleLogin();
    };

    // If already logged in, redirect to schedule
    if (user) {
        navigate("/schedule");
        return null;
    }

    return (
        <Container size="sm" style={{ marginTop: "10rem" }}>
            <Stack align="center" gap="xl">
                <Title order={1}>Cornell Class Scheduler</Title>
                <Title order={3} c="dimmed">
                    Plan your semester schedule
                </Title>
                <Stack gap="md" style={{ width: "100%", maxWidth: "300px" }}>
                    <Button size="lg" fullWidth onClick={handleLogin}>
                        Login with Google
                    </Button>
                    <Button size="lg" fullWidth variant="outline" onClick={handleSignup}>
                        Sign Up with Google
                    </Button>
                </Stack>
            </Stack>
        </Container>
    );
};

export default HomePage;
