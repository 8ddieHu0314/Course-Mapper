// Shared types across both frontend and backend!

export type WeatherResponse = {
    raining: boolean;
};

// Cornell API Types
export type CornellClassResponse = {
    status: string;
    data: {
        classes: CornellClass[];
        meta: {
            roster: string;
        };
    };
};

export type CornellClass = {
    crseId: string;
    strm: string;
    classSection: string;
    ssrComponent: string;
    classNbr: string;
    subject: string;
    catalogNbr: string;
    title: string;
    descr: string;
    enrollGroups: EnrollGroup[];
    catalogBreadth?: string;
    catalogDistr?: string;
    catalogWhenOffered?: string;
    catalogPrereqCoreq?: string;
    catalogPrereq?: string;
    catalogCoreq?: string;
    catalogPermission?: string;
    catalogEnrollmentPriority?: string;
    crseAttrs: CourseAttribute[];
    lastTermsOffered?: string;
};

export type EnrollGroup = {
    classSection: string;
    ssrComponent: string;
    units: string;
    meetings: Meeting[];
    enrollmentReq?: string;
    enrollmentReqDescr?: string;
    enrollmentReqDescrlong?: string;
};

export type Meeting = {
    pattern: string;
    timeStart: string;
    timeEnd: string;
    bldgDescr: string;
    facilityDescr: string;
    instructors: Instructor[];
};

export type Instructor = {
    firstName: string;
    lastName: string;
    netid?: string;
};

export type CourseAttribute = {
    crseAttr: string;
    crseAttrValue: string;
    descr: string;
    descrformal: string;
    attrDescr: string;
    attrDescrShort: string;
};

// Schedule Types
export type Schedule = {
    id: string;
    userId: string;
    roster: string; // e.g., "FA25"
    courses: ScheduledCourse[];
    createdAt: string;
    updatedAt: string;
};

export type ScheduledCourse = {
    id: string;
    crseId: string;
    subject: string;
    catalogNbr: string;
    title: string;
    classSection: string;
    ssrComponent: string;
    classNbr: string;
    enrollGroupIndex: number;
    meetings: ScheduledMeeting[];
    units: string;
};

export type ScheduledMeeting = {
    pattern: string; // e.g., "MWF", "TR"
    timeStart: string; // e.g., "10:10"
    timeEnd: string; // e.g., "11:25"
    bldgDescr: string; // e.g., "Phillips Hall"
    facilityDescr: string; // e.g., "101"
    instructors: Instructor[];
    coordinates?: {
        lat: number;
        lng: number;
    };
};

// Google Maps Types
export type GeocodeResponse = {
    lat: number;
    lng: number;
    formattedAddress: string;
};

export type DirectionsResponse = {
    distance: number; // in meters
    duration: number; // in seconds
    polyline: string; // encoded polyline
    steps: DirectionStep[];
};

export type DirectionStep = {
    distance: number;
    duration: number;
    instruction: string;
    startLocation: { lat: number; lng: number };
    endLocation: { lat: number; lng: number };
};

// API Response Types
export type ApiError = {
    error: string;
    message?: string;
};

export type ScheduleResponse = {
    schedule: Schedule;
};

export type SchedulesResponse = {
    schedules: Schedule[];
};
