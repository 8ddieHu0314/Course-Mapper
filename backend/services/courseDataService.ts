import fs from "fs";
import path from "path";

// Types for course data
export interface CourseData {
    university: {
        [key: string]: UniversityData;
    };
    college: {
        [key: string]: CollegeData;
    };
}

export interface UniversityData {
    name: string;
    requirements: Requirement[];
}

export interface CollegeData {
    name: string;
    requirements: Requirement[];
}

export interface Requirement {
    name: string;
    description: string;
    source: string;
    fulfilledBy: string;
    perSlotMinCount: number[];
    slotNames: string[];
    allowCourseDoubleCounting?: boolean;
    conditions?: {
        [key: string]: {
            colleges?: string[];
            majorsExcluded?: string[];
        };
    };
    courses: number[][];
}

export interface SearchResult {
    courseId: number;
    requirementName: string;
    requirementDescription: string;
    college: string;
    university: string;
}

class CourseDataService {
    private courseData: CourseData | null = null;
    private courseIndex: Map<number, SearchResult[]> = new Map();

    /**
     * Load and parse the course data from JSON file
     */
    async initialize(): Promise<void> {
        try {
            const dataPath = path.join(__dirname, "../data/decorated-requirements.json");
            
            if (!fs.existsSync(dataPath)) {
                throw new Error(`Course data file not found at ${dataPath}`);
            }

            const fileContent = fs.readFileSync(dataPath, "utf-8");
            this.courseData = JSON.parse(fileContent);
            
            // Build index for faster lookups
            this.buildIndex();
            
            console.log("✓ Course data loaded successfully");
            console.log(`  - Indexed ${this.courseIndex.size} unique courses`);
        } catch (error) {
            console.error("Failed to load course data:", error);
            throw error;
        }
    }

    /**
     * Build an index mapping course IDs to their requirements
     */
    private buildIndex(): void {
        if (!this.courseData) return;

        // Index university requirements
        for (const [univKey, univData] of Object.entries(this.courseData.university)) {
            for (const requirement of univData.requirements) {
                this.indexRequirement(requirement, univKey, "university");
            }
        }

        // Index college requirements
        for (const [collegeKey, collegeData] of Object.entries(this.courseData.college)) {
            for (const requirement of collegeData.requirements) {
                this.indexRequirement(requirement, collegeKey, "college");
            }
        }
    }

    /**
     * Add a requirement's courses to the index
     */
    private indexRequirement(
        requirement: Requirement,
        source: string,
        type: "university" | "college"
    ): void {
        // Guard: ensure courses exists and is iterable
        if (!requirement.courses || !Array.isArray(requirement.courses)) {
            return;
        }

        for (const courseSlot of requirement.courses) {
            // Guard: skip if courseSlot is not an array
            if (!Array.isArray(courseSlot)) {
                continue;
            }

            for (const courseId of courseSlot) {
                const key = courseId;
                if (!this.courseIndex.has(key)) {
                    this.courseIndex.set(key, []);
                }

                this.courseIndex.get(key)!.push({
                    courseId,
                    requirementName: requirement.name,
                    requirementDescription: requirement.description,
                    college: type === "college" ? source : "",
                    university: type === "university" ? source : "",
                });
            }
        }
    }

    /**
     * Search for courses by ID
     */
    searchById(courseId: number): SearchResult[] {
        return this.courseIndex.get(courseId) || [];
    }

    /**
     * Search for requirements by name (fuzzy matching)
     */
    searchRequirements(query: string): Requirement[] {
        if (!this.courseData) return [];

        const results: Requirement[] = [];
        const lowerQuery = query.toLowerCase();

        // Search university requirements
        for (const univData of Object.values(this.courseData.university)) {
            for (const req of univData.requirements) {
                if (
                    req.name.toLowerCase().includes(lowerQuery) ||
                    req.description.toLowerCase().includes(lowerQuery)
                ) {
                    results.push(req);
                }
            }
        }

        // Search college requirements
        for (const collegeData of Object.values(this.courseData.college)) {
            for (const req of collegeData.requirements) {
                if (
                    req.name.toLowerCase().includes(lowerQuery) ||
                    req.description.toLowerCase().includes(lowerQuery)
                ) {
                    results.push(req);
                }
            }
        }

        return results;
    }

    /**
     * Get all courses for a specific requirement
     */
    getCoursesByRequirement(requirementName: string): number[] {
        if (!this.courseData) return [];

        const courses = new Set<number>();

        // Search university requirements
        for (const univData of Object.values(this.courseData.university)) {
            for (const req of univData.requirements) {
                if (req.name === requirementName) {
                    for (const courseSlot of req.courses) {
                        for (const courseId of courseSlot) {
                            courses.add(courseId);
                        }
                    }
                }
            }
        }

        // Search college requirements
        for (const collegeData of Object.values(this.courseData.college)) {
            for (const req of collegeData.requirements) {
                if (req.name === requirementName) {
                    for (const courseSlot of req.courses) {
                        for (const courseId of courseSlot) {
                            courses.add(courseId);
                        }
                    }
                }
            }
        }

        return Array.from(courses);
    }

    /**
     * Get all unique requirement names
     */
    getAllRequirements(): string[] {
        if (!this.courseData) return [];

        const requirements = new Set<string>();

        for (const univData of Object.values(this.courseData.university)) {
            for (const req of univData.requirements) {
                requirements.add(req.name);
            }
        }

        for (const collegeData of Object.values(this.courseData.college)) {
            for (const req of collegeData.requirements) {
                requirements.add(req.name);
            }
        }

        return Array.from(requirements).sort();
    }

    /**
     * Get statistics about the loaded data
     */
    getStats() {
        return {
            totalUniquesCourses: this.courseIndex.size,
            universities: Object.keys(this.courseData?.university || {}),
            colleges: Object.keys(this.courseData?.college || {}),
        };
    }
}

// Singleton instance
export const courseDataService = new CourseDataService();
