import { Text } from "@mantine/core";
import styles from "../../styles/components/TBANotice.module.css";

interface TBACourse {
    courseCode: string;
    ssrComponent?: string;
}

interface TBANoticeProps {
    courses: TBACourse[];
}

/**
 * Displays a warning notice for courses with TBA (To Be Announced) locations
 * These courses won't be shown on the map
 */
export const TBANotice = ({ courses }: TBANoticeProps) => {
    if (courses.length === 0) return null;

    return (
        <div className={styles.container}>
            <Text size="sm" fw={600} className={styles.header}>
                ⚠️ Courses with no location ({courses.length}):
            </Text>
            <div className={styles.list}>
                {courses.map((course, idx) => (
                    <div key={idx} className={styles.item}>
                        <span className={styles.courseCode}>{course.courseCode}</span>
                        <span className={styles.component}>
                            {course.ssrComponent 
                                ? `(${course.ssrComponent}) - Location TBA`
                                : "- Location TBA"
                            }
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

