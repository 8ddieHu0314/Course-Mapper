import { PATHS } from "../constants/Navigation";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Group, Text, Button } from "@mantine/core";

const RootLayout = () => {
    const { user, logout } = useAuth();

    return (
        <div>
            <div style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    {PATHS.map((link) => (
                        <Link
                            key={link.label}
                            to={link.link}
                            style={{ marginRight: '1rem', textDecoration: 'none' }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
                {user && (
                    <Group gap="sm">
                        <Text size="sm">{user.email}</Text>
                        <Button size="xs" variant="outline" onClick={logout}>
                            Logout
                        </Button>
                    </Group>
                )}
            </div>
            <div>
                <Outlet />
            </div>
        </div>
    );
};

export default RootLayout;
