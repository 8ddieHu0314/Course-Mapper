import { PATHS } from "../constants/Navigation";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Group, Text, Button } from "@mantine/core";
import "./RootLayout.css";

const RootLayout = () => {
    const { user, logout } = useAuth();

    return (
        <div className="root-layout">
            <div className="header">
                <div className="nav-links">
                    {PATHS.map((link) => (
                        <Link
                            key={link.label}
                            to={link.link}
                            className="nav-link"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
                {user && (
                    <Group spacing="sm">
                        <Text size="sm">{user.email}</Text>
                        <Button size="xs" variant="outline" onClick={logout}>
                            Logout
                        </Button>
                    </Group>
                )}
            </div>
            <div className="content">
                <Outlet />
            </div>
        </div>
    );
};

export default RootLayout;
