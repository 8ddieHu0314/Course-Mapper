import { ScheduledCourse } from "@full-stack/types";
import { CourseBlock } from "../utils/calendar-utils";

/** A course block paired with its metadata for display */
export type CourseItem = {
    block: CourseBlock;
    metadata: ScheduledCourse | null;
};

/** Layout of courses arranged into non-overlapping columns */
export type ColumnLayout = CourseItem[][];

