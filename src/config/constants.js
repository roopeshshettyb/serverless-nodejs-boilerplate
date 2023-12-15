let environmentData = process.env;

const permissions = { CREATE: 'CREATE', READ: 'READ', UPDATE: 'UPDATE', DELETE: 'DELETE' };

const contextForGrading = ['GRADE 10', 'GRADE 12', 'BACHELORS', 'MASTERS'];

const roles = {
    ASPIRANT: 'ASPIRANT',
    ADMIN: 'ADMIN',
    TPO: 'TPO'
};

const UNIQUE_KEYS = {
    USERS: environmentData.MODEL_KEY_USERS,
    INSTITUTES: environmentData.MODEL_KEY_INSTITUTES,
    COMPANIES: environmentData.MODEL_KEY_COMPANIES,
    ELIGIBILITIES: environmentData.MODEL_KEY_ELIGIBILITIES,
    QUESTIONS: environmentData.MODEL_KEY_QUESTIONS,
    LISTINGS: environmentData.MODEL_KEY_LISTINGS,
    STAGES: environmentData.MODEL_KEY_STAGES,
    GRADES: environmentData.MODEL_KEY_GRADES,
    ASPIRANTS: environmentData.MODEL_KEY_ASPIRANTS,
    APPLICATIONS: environmentData.MODEL_KEY_APPLICATIONS,
    QUESTION_RESPONSES: environmentData.MODEL_KEY_QUESTION_RESPONSES,
    CALENDAR: 'calendar'
};

const foreignKeysModelMapping = {
    instituteIds: UNIQUE_KEYS.INSTITUTES,
    stageIds: UNIQUE_KEYS.STAGES,
    currentStageId: UNIQUE_KEYS.STAGES,
    companyId: UNIQUE_KEYS.COMPANIES,
    listerIds: UNIQUE_KEYS.USERS,
    listingIds: UNIQUE_KEYS.LISTINGS,
    listingId: UNIQUE_KEYS.LISTINGS,
    questionIds: UNIQUE_KEYS.QUESTIONS,
    eligibilityIds: UNIQUE_KEYS.ELIGIBILITIES,
    gradeIds: UNIQUE_KEYS.GRADES,
    userId: UNIQUE_KEYS.USERS,
    aspirantId: UNIQUE_KEYS.ASPIRANTS
};

const constants = {
    ENV: environmentData.NODE_ENV,
    SERVICE_NAME: environmentData.SERVICE_NAME,
    ORGANISATION_NAME: environmentData.ORGANISATION_NAME,
    APPLICATION_DETAILS: {
        NAME: environmentData.APP_NAME,
        LOGO: environmentData.APP_LOGO,
        THEME_COLOR: environmentData.APP_THEME_COLOR
    },
    MODEL_DEFAULTS: {
        USER: {
            GENDER: ['MALE', 'FEMALE', 'Rather Not Say']
        },
        INSTITUTE: {
            TYPE: ['COLLEGE', 'TRAINING INSTITUTE', 'PLACEMENT INSTITUTE', 'CONSULTANCY']
        },
        LISTING: {
            STATUS: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', DRAFT: 'DRAFT', CLOSED: 'CLOSED' },
            POSITION_TYPE: ['FULL-TIME', 'PART-TIME', 'INTERNSHIP', 'FREELANCE', 'CONTRACT']
        },
        ROLES: {
            ALL: Object.keys(roles),
            ...roles
        },
        ELIGIBILITIES: {
            CONTEXT: contextForGrading
        },
        GRADES: {
            CONTEXT: contextForGrading
        },
        APPLICATION: {
            STATUS: { APPLIED: 'APPLIED', WAITING: 'WAITING FOR COMPANY RESPONSE', OFFERED: 'OFFERED', ACCEPTED: 'OFFER ACCEPTED', REJECTED: 'REJECTED', OFFER_REJECTED: 'OFFER REJECTED' }
        },
        PERMISSIONS: permissions,
        UNIQUE_KEYS,
        FOREIGN_KEY_MODEL_MAPPING: foreignKeysModelMapping
    },
    AUTH: {
        JWT_SECRET: environmentData.JWT_SECRET,
        HASHING_SALT_ROUNDS: parseInt(environmentData.HASHING_SALT_ROUNDS),
        TOKEN_EXPIRY_IN_HOURS: parseInt(environmentData.TOKEN_EXPIRY_IN_HOURS)
    },
    DATABASES: {
        POSTGRES: {
            dialect: 'postgres',
            HOST: environmentData.POSTGRES_HOST,
            USERNAME: environmentData.POSTGRES_USERNAME,
            PASSWORD: environmentData.POSTGRES_PASSWORD,
            DATABASE: environmentData.POSTGRES_DATABASE,
            PORT: environmentData.POSTGRES_PORT,
            LOGS: environmentData.POSTGRES_LOGS === 'true',
            DB_ALTER: environmentData.POSTGRES_DB_ALTER === 'true',
            MODEL_ALTER: environmentData.POSTGRES_MODEL_ALTER === 'true',
            USE_SSL: environmentData.POSTGRES_USE_SSL === 'true'
        },
        REDIS: {
            HOST: environmentData.REDIS_HOST,
            PORT: environmentData.REDIS_PORT,
            USERNAME: environmentData.REDIS_USERNAME,
            PASSWORD: environmentData.REDIS_PASSWORD
        }
    },
    EMAIL: {
        AUTHORIZATION_CODE: environmentData.GMAIL_AUTHORIZATION_CODE,
        CLIENT_ID: environmentData.GMAIL_CLIENT_ID,
        CLIENT_SECRET: environmentData.GMAIL_CLIENT_SECRET,
        REDIRECT_URL: environmentData.GMAIL_REDIRECT_URL,
        EMAIL_ADDRESS: environmentData.GMAIL_EMAIL_ADDRESS,
        REFRESH_TOKEN: environmentData.GMAIL_REFRESH_TOKEN,
        MAX_LIMIT_IN_QUEUE: environmentData.EMAIL_MAX_LIMIT_IN_QUEUE
    },
    AWS: {
        S3: {
            PRIVATE_BUCKET_NAME: environmentData.S3_PRIVATE_BUCKET_NAME,
            PUBLIC_BUCKET_NAME: environmentData.S3_PUBLIC_BUCKET_NAME,
            BUCKET_REGION: environmentData.S3_BUCKET_REGION,
            PRIVATE_URL_PREFIX: environmentData.PRIVATE_S3_URL_PREFIX,
            PUBLIC_URL_PREFIX: environmentData.PUBLIC_S3_URL_PREFIX
        },
        CREDENTIALS: {
            ACCESS_KEY: environmentData.APP_AWS_ACCESS_KEY,
            SECRET_ACCESS_KEY: environmentData.APP_AWS_SECRET_ACCESS_KEY
        },
        SQS: {
            REGION: environmentData.SQS_QUEUE_REGION,
            BATCHING: {
                QUEUE_URL: environmentData.BATCHING_QUEUE_URL,
                QUEUE_ARN: environmentData.BATCHING_QUEUE_ARN
            },
            SEND_EMAIL: {
                QUEUE_URL: environmentData.SEND_EMAIL_QUEUE_URL,
                QUEUE_ARN: environmentData.SEND_EMAIL_QUEUE_ARN
            },
            BULK_CREATE: {
                QUEUE_URL: environmentData.BULK_CREATE_QUEUE_URL,
                QUEUE_ARN: environmentData.BULK_CREATE_QUEUE_ARN
            },
            BULK_CREATE_FAILED_RECORDS: {
                QUEUE_URL: environmentData.BULK_CREATE_QUEUE_FAILED_RECORDS_URL,
                QUEUE_ARN: environmentData.BULK_CREATE_QUEUE_FAILED_RECORDS_ARN
            },
            EXPORT_APPLICANTS_DATA: {
                QUEUE_URL: environmentData.EXPORT_APPLICANTS_DATA_URL,
                QUEUE_ARN: environmentData.EXPORT_APPLICANTS_DATA_ARN
            }
        }
    },
    CSV_BATCHING: {
        CHUNK_SIZE: parseInt(environmentData.CSV_BATCHING_CHUNK_SIZE),
        STATUS: {
            MAKING_CHUNKS: 'MAKING_CHUNKS',
            CHUNKS_PROCESSING: 'CHUNKS_PROCESSING',
            CREATING_DATA: 'CREATING_DATA',
            SENDING_EMAILS: 'SENDING_EMAILS',
            FILE_UPLOADED: 'FILE_UPLOADED',
            COMPLETED: 'COMPLETED'
        },
        CHUNK_PROCESSING_STATUS: {
            PENDING: 'PENDING',
            PROCESSING: 'PROCESSING',
            PROCESSED: 'PROCESSED'
        }
    },
    REACT_APP: {
        URL: environmentData.REACT_APP_URL,
        ROUTES: {
            RESET_PASSWORD: 'users/reset-password'
        }
    }
};

module.exports = constants;