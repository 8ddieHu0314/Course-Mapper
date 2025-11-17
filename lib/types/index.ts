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
    strm: number;
    crseId: number;
    crseOfferNbr: number;
    subject: string;
    catalogNbr: string;
    titleShort: string;
    titleLong: string;
    crseAttrs: CourseAttribute[];
    crseAttrValueGroups: CourseAttributeValueGroup[];
    enrollGroups: EnrollGroup[];
    description: string;
    catalogBreadth?: string | null;
    catalogDistr?: string | null;
    catalogEnrollmentPriority?: string;
    catalogLang?: string | null;
    catalogForbiddenOverlaps?: string | null;
    catalogAttribute?: string | null;
    catalogWhenOffered?: string | null;
    catalogComments?: string | null;
    catalogPrereqCoreq?: string | null;
    catalogPrereq?: string;
    catalogCoreq?: string;
    catalogPermission?: string | null;
    catalogFee?: string | null;
    catalogSatisfiesReq?: string | null;
    catalogCourseSubfield?: string | null;
    catalogOutcomes?: string[];
    acadCareer: string;
    acadGroup: string;
    catalogName?: string | null;
    catalogNextOffered?: string | null;
    lastTermsOffered?: string;
    catalogCredits?: string | null;
    catalogGradeOption?: string | null;
    catalogLocation?: string | null;
    catalogCrosslisted?: string | null;
    catalogCrosslistings?: string | null;
    catalogComeets?: string | null;
    exploreCriteriaIds?: any[];
};

export type CourseAttribute = {
    crseAttr: string;
    crseAttrValue: string;
    descr: string;
    descrformal: string;
    attrDescr: string;
    attrDescrShort: string;
};

export type CourseAttributeValueGroup = {
    attrDescr: string;
    crseAttrValues: string;
};

export type EnrollGroup = {
    classSections: ClassSection[];
    unitsMinimum: number;
    unitsMaximum: number;
    componentsOptional: string[];
    componentsRequired: string[];
    gradingBasis: string;
    gradingBasisShort: string;
    gradingBasisLong: string;
    simpleCombinations: any[];
    sessionCode: string;
    sessionBeginDt: string;
    sessionEndDt: string;
    sessionLong: string;
    exploreCriteriaIds?: any[];
};

export type ClassSection = {
    ssrComponent: string;
    ssrComponentLong: string;
    section: string;
    classNbr: number;
    meetings: Meeting[];
    notes?: ClassNote[];
    campus: string;
    campusDescr: string;
    location: string;
    locationDescr: string;
    startDt: string;
    endDt: string;
    addConsent: string;
    addConsentDescr: string;
    isComponentGraded: boolean;
    crseAttrs?: CourseAttribute[];
    instructionMode: string;
    instrModeDescrshort: string;
    instrModeDescr: string;
    topicDescription?: string;
    openStatus: string;
    exploreCriteriaIds?: any[];
    materials?: any[];
};

export type Meeting = {
    classMtgNbr: number;
    timeStart: string;
    timeEnd: string;
    startDt: string;
    endDt: string;
    instructors: Instructor[];
    pattern: string;
    meetingTopicDescription?: string;
    bldgDescr?: string;
    facilityDescr?: string;
};

export type ClassNote = {
    classNotesSeq: number;
    descrlong: string;
};

export type Instructor = {
    instrAssignSeq: number;
    netid?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
};

// Schedule Types
export type Schedule = {
    id: string;
    userId: string;
    roster: string;
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
    pattern: string;
    timeStart: string;
    timeEnd: string;
    bldgDescr: string;
    facilityDescr: string;
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
