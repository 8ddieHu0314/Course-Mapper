# Course Data

This folder contains course information used by the Course Mapper application.

## Files

### `decorated-requirements.json`
Comprehensive course database containing all available courses at the university. This file includes:
- Course metadata (IDs, names, descriptions)
- University requirements and prerequisites
- Course offerings and scheduling information
- Fulfillment requirements and course groupings

**Size**: ~298K lines of course data

**Usage**: This file is used to power the scheduler search feature, enabling users to:
- Search for courses by name, ID, or requirement
- Filter courses by prerequisites and requirements
- Build course schedules based on constraints
- Validate course combinations against university requirements

## Scheduler Search Feature

The course data is utilized in the scheduler search feature to provide intelligent course recommendations and validations when building course schedules.

To use this data in the backend API:
1. Load the JSON file during server initialization
2. Parse and index the courses for efficient search
3. Expose search endpoints that query this data
4. Return filtered results to the frontend search component
