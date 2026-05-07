import { z } from 'zod';

/**
 * Zod Schemas for Theme Validation
 * Each theme has its own schema defining required and optional fields
 * All schemas include config_version for future migration safety
 */

// ============================================================================
// FREELANCER THEMES
// ============================================================================

export const QuickPitchSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),
    headline: z.string().min(1, 'Headline is required').max(100),
    subhead: z.string().min(1, 'Subhead is required').max(300),
    email: z.string().email('Valid email is required'),

    // Optional fields
    calendlyUrl: z.string().url().optional().or(z.literal('')),

    // Section Titles (Customizable Context)
    servicesTitle: z.string().max(50).optional().default('My Services'),
    services: z.array(z.object({
        title: z.string().min(1).max(100),
        desc: z.string().min(1).max(500)
    })).max(3).optional().default([]),

    testimonialsTitle: z.string().max(50).optional().default('What Clients Say'),
    testimonials: z.array(z.object({
        quote: z.string().min(1).max(500),
        name: z.string().min(1).max(100),
        role: z.string().min(1).max(100)
    })).max(3).optional().default([])
});

export const SkillStackSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),
    bio: z.string().min(1, 'Bio is required').max(500),
    email: z.string().email('Valid email is required'),

    // Optional fields
    skillsTitle: z.string().max(50).optional().default('Technical Skills'),
    skills: z.array(z.object({
        name: z.string().min(1).max(50),
        level: z.number().min(0).max(100)
    })).max(10).optional().default([]),

    projectsTitle: z.string().max(50).optional().default('Featured Projects'),
    projects: z.array(z.object({
        title: z.string().min(1).max(100),
        desc: z.string().min(1).max(1000),
        image: z.string().optional(),
        tech: z.array(z.string()).max(10)
    })).max(6).optional().default([]),

    resumeUrl: z.string().url().optional().or(z.literal('')),
    resumeButtonText: z.string().max(50).optional().default('Download Resume'),

    github: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal(''))
});

export const HireMeNowSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),
    available: z.boolean().default(true),

    // Optional fields
    offer: z.object({
        title: z.string().max(100),
        desc: z.string().max(500),
        expiry: z.string() // ISO date string
    }).optional(),

    pricingTitle: z.string().max(50).optional().default('Services & Pricing'),
    pricingTiers: z.array(z.object({
        name: z.string().min(1).max(50),
        price: z.string().min(1).max(50),
        features: z.array(z.string()).max(10)
    })).max(3).optional().default([]),

    calendarTitle: z.string().max(50).optional().default('Availability'),
    calendlyUrl: z.string().url().optional().or(z.literal('')),
    email: z.string().email().optional()
});

export const StoryBuilderSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),
    manifesto: z.string().min(1, 'Philosophy/manifesto is required').max(500),

    // Optional fields
    storyBlocks: z.array(z.object({
        type: z.enum(['text', 'image']),
        content: z.string()
    })).max(10).optional().default([]),

    caseSnippetsTitle: z.string().max(50).optional().default('Client Transformations'),
    caseSnippets: z.array(z.object({
        title: z.string().min(1).max(100),
        before: z.string().min(1).max(500),
        after: z.string().min(1).max(500)
    })).max(5).optional().default([]),

    ctaText: z.string().max(50).optional(),
    ctaLink: z.string().url().optional().or(z.literal(''))
});

export const LocalProSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),
    serviceArea: z.string().min(1, 'Service area is required').max(100),
    phone: z.string().min(1, 'Phone number is required'),
    email: z.string().email('Valid email is required'),

    // Optional fields
    since: z.string().max(10).optional(),

    galleryTitle: z.string().max(50).optional().default('Our Work'),
    gallery: z.array(z.object({
        location: z.string().max(100),
        alt: z.string().max(100),
        url: z.string().url().optional()
    })).max(8).optional().default([]),

    reviewsTitle: z.string().max(50).optional().default('Local Reviews'),
    reviews: z.array(z.object({
        text: z.string().min(1).max(500),
        name: z.string().min(1).max(100),
        location: z.string().max(100),
        rating: z.number().min(1).max(5)
    })).max(6).optional().default([]),

    faqTitle: z.string().max(50).optional().default('Frequently Asked Questions'),
    faq: z.array(z.object({
        q: z.string().min(1).max(200),
        a: z.string().min(1).max(500)
    })).max(10).optional().default([]),

    mapTitle: z.string().max(50).optional().default('Service Area'),
    mapEmbedUrl: z.string().url().optional().or(z.literal(''))
});

export const SideHustleSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),
    intro: z.string().min(1, 'Intro is required').max(300),
    email: z.string().email('Valid email is required'),

    // Optional fields
    offersTitle: z.string().max(50).optional().default('What I Can Do For You'),
    offers: z.array(z.object({
        title: z.string().min(1).max(50),
        emoji: z.string().max(10),
        desc: z.string().min(1).max(500)
    })).max(6).optional().default([]),

    funFactsTitle: z.string().max(50).optional().default('Fun Facts'),
    funFacts: z.array(z.object({
        label: z.string().min(1).max(50),
        value: z.string().min(1).max(20)
    })).max(5).optional().default([]),

    socials: z.object({
        instagram: z.string().url().optional(),
        twitter: z.string().url().optional(),
        linkedin: z.string().url().optional()
    }).optional()
});

// ============================================================================
// PORTFOLIO THEMES
// ============================================================================

export const GalleryGridSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),
    intro: z.string().min(1, 'Intro is required').max(500),
    email: z.string().email('Valid email is required'),

    // Optional fields
    projectsTitle: z.string().max(50).optional().default('My Work'),
    projects: z.array(z.object({
        title: z.string().min(1).max(100),
        category: z.string().max(50),
        tags: z.array(z.string()).max(10),
        featured: z.string().optional() // emoji or image URL
    })).max(20).optional().default([]),
    aboutTitle: z.string().max(50).optional().default('About Me'),
    about: z.string().max(500).optional(),
    instagram: z.string().max(50).optional()
});

export const CaseStudySchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),
    intro: z.string().min(1, 'Intro is required').max(500),
    email: z.string().email('Valid email is required'),

    // Optional fields
    caseStudiesTitle: z.string().max(50).optional().default('Case Studies'),
    caseStudies: z.array(z.object({
        title: z.string().min(1).max(100),
        heroImage: z.string().optional(),
        challenge: z.string().min(1).max(1000),
        process: z.string().min(1).max(1000),
        solution: z.string().min(1).max(1000),
        results: z.array(z.object({
            metric: z.string().max(50),
            value: z.string().max(50)
        })).max(5)
    })).max(5).optional().default([]),
    toolsTitle: z.string().max(50).optional().default('Tools & Tech'),
    tools: z.array(z.string()).max(20).optional().default([]),
    docsUrl: z.string().url().optional().or(z.literal(''))
});

export const MinimalistCVSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),
    role: z.string().min(1, 'Role is required').max(100),
    headline: z.string().min(1, 'Headline is required').max(300),
    email: z.string().email('Valid email is required'),

    // Optional fields
    featuredProject: z.object({
        title: z.string().max(100),
        link: z.string().url(),
        image: z.string().optional(),
        desc: z.string().max(1000)
    }).optional(),

    skillsTitle: z.string().max(50).optional().default('Expertise'),
    skills: z.array(z.object({
        name: z.string().max(50),
        proficiency: z.number().min(0).max(100)
    })).max(10).optional().default([]),

    experienceTitle: z.string().max(50).optional().default('Experience'),
    experience: z.array(z.object({
        company: z.string().max(100),
        role: z.string().max(100),
        dates: z.string().max(50),
        bullets: z.array(z.string()).max(5)
    })).max(10).optional().default([]),

    educationTitle: z.string().max(50).optional().default('Education'),
    education: z.array(z.object({
        school: z.string().max(100),
        degree: z.string().max(100),
        year: z.string().max(10)
    })).max(5).optional().default([]),
    resumeUrl: z.string().url().optional().or(z.literal(''))
});

export const MotionReelSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Valid email is required'),

    // Optional fields
    heroReel: z.object({
        url: z.string().url().optional(),
        poster: z.string().optional()
    }).optional(),

    projectsTitle: z.string().max(50).optional().default('Featured Work'),
    projects: z.array(z.object({
        title: z.string().max(100),
        thumbnail: z.string().optional(),
        videoUrl: z.string().url().optional(),
        duration: z.string().max(10)
    })).max(12).optional().default([]),

    btsTitle: z.string().max(50).optional().default('Behind the Scenes'),
    bts: z.array(z.object({
        caption: z.string().max(500),
        media: z.string().optional()
    })).max(6).optional().default([])
});

export const InteractiveDemoSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),

    // Optional fields
    githubUrl: z.string().url().optional().or(z.literal('')),
    heroDemo: z.object({
        url: z.string().url().optional().or(z.literal('')),
        title: z.string().max(100)
    }).optional(),

    demosTitle: z.string().max(50).optional().default('Interactive Demos'),
    demos: z.array(z.object({
        title: z.string().max(100),
        embedUrl: z.string().url().optional().or(z.literal('')),
        tech: z.array(z.string()).max(10)
    })).max(10).optional().default([]),

    snippetsTitle: z.string().max(50).optional().default('Code Snippets'),
    snippets: z.array(z.object({
        language: z.string().max(50),
        code: z.string().max(2000)
    })).max(10).optional().default([])
});

export const NarrativeScrollSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Name is required').max(100),
    epilogue: z.object({
        text: z.string().min(1, 'Epilogue text is required').max(500),
        ctaText: z.string().min(1).max(100),
        ctaLink: z.string().url().or(z.literal(''))
    }),

    // Optional fields
    chapters: z.array(z.object({
        title: z.string().max(50),
        body: z.string().max(1000),
        bgImage: z.string().optional()
    })).max(10).optional().default([]),

    artifactsTitle: z.string().max(50).optional().default('Selected Artifacts'),
    artifacts: z.array(z.object({
        title: z.string().max(100),
        link: z.string().url()
    })).max(10).optional().default([])
});

// ============================================================================
// PRODUCT THEMES
// ============================================================================

export const LaunchPadSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Product name is required').max(100),
    tagline: z.string().min(1, 'Tagline is required').max(200),

    // Optional fields
    heroVideo: z.string().optional(),
    problem: z.string().max(1000).optional(),
    solution: z.string().max(1000).optional(),
    waitlistCta: z.string().max(50).optional().default('Join the Waitlist'),

    testimonialsTitle: z.string().max(50).optional().default('What Early Adopters Say'),
    testimonials: z.array(z.object({
        quote: z.string().max(500),
        name: z.string().max(100),
        role: z.string().max(100)
    })).max(5).optional().default([]),

    faqTitle: z.string().max(50).optional().default('FAQ'),
    faq: z.array(z.object({
        q: z.string().max(200),
        a: z.string().max(500)
    })).max(10).optional().default([])
});

export const FeatureFocusSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Product name is required').max(100),
    tagline: z.string().min(1, 'Tagline is required').max(200),

    // Optional fields
    featuresTitle: z.string().max(50).optional().default('Key Features'),
    features: z.array(z.object({
        title: z.string().max(100),
        desc: z.string().max(200),
        icon: z.string().optional(),
        image: z.string().optional()
    })).max(5).optional().default([]),

    comparisonTitle: z.string().max(50).optional().default('How We Compare'),
    comparison: z.object({
        enabled: z.boolean().default(false),
        rows: z.array(z.object({
            feature: z.string().max(100),
            self: z.string().max(50),
            competitor: z.string().max(50)
        })).max(10)
    }).optional(),
    ctaPrimary: z.string().max(50).optional().default('Start Free Trial'),
    ctaSecondary: z.string().max(50).optional().default('View Pricing')
});

export const DigitalDownloadSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Product name is required').max(100),
    price: z.string().min(1, 'Price is required').max(50),

    // Optional fields
    previewItems: z.array(z.string()).max(10).optional().default([]),

    includedTitle: z.string().max(50).optional().default("What's Included"),
    included: z.array(z.string()).max(20).optional().default([]),

    testimonialsTitle: z.string().max(50).optional().default('Customer Reviews'),
    testimonials: z.array(z.object({
        text: z.string().max(500),
        name: z.string().max(100)
    })).max(5).optional().default([]),
    buyLink: z.string().url().optional().or(z.literal(''))
});

export const HardwareShowcaseSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Product name is required').max(100),
    price: z.string().min(1, 'Price is required').max(50),

    // Optional fields
    gallery: z.array(z.string()).max(10).optional().default([]),

    specsTitle: z.string().max(50).optional().default('Tech Specs'),
    specs: z.array(z.object({
        key: z.string().max(50),
        value: z.string().max(100)
    })).max(20).optional().default([]),

    variantsTitle: z.string().max(50).optional().default('Available Options'),
    variants: z.array(z.object({
        name: z.string().max(50),
        inStock: z.boolean().default(true)
    })).max(10).optional().default([]),
    shippingNote: z.string().max(200).optional()
});

export const OpenSourceSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Project name is required').max(100),
    tagline: z.string().min(1, 'Tagline is required').max(200),
    githubUrl: z.string().url('GitHub URL is required'),

    // Optional fields
    stats: z.array(z.object({
        label: z.string().max(50),
        value: z.string().max(20),
        icon: z.string().max(50)
    })).max(5).optional().default([]),
    quickStart: z.string().max(200).optional(),

    featuresTitle: z.string().max(50).optional().default('Features'),
    features: z.array(z.object({
        title: z.string().max(100),
        desc: z.string().max(200)
    })).max(10).optional().default([]),

    contributorsTitle: z.string().max(50).optional().default('Contributors'),
    contributors: z.array(z.string()).max(20).optional().default([]),
    docsUrl: z.string().url().optional().or(z.literal(''))
});

export const NicheToolSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Tool name is required').max(100),
    tagline: z.string().min(1, 'Tagline is required').max(200),

    // Optional fields
    demoEmbed: z.string().optional(),
    problem: z.string().max(500).optional(),
    solution: z.string().max(500).optional(),

    useCasesTitle: z.string().max(50).optional().default('Common Use Cases'),
    useCases: z.array(z.string()).max(10).optional().default([]),

    pricing: z.object({
        free: z.string().max(100),
        pro: z.string().max(100)
    }).optional(),
    ctaLink: z.string().url().optional().or(z.literal(''))
});

// ============================================================================
// BUSINESS THEMES
// ============================================================================

export const LocalBizSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Business name is required').max(100),
    category: z.string().min(1, 'Category is required').max(50),
    address: z.string().min(1, 'Address is required').max(200),
    email: z.string().email('Valid email is required'),

    // Optional fields
    phone: z.string().optional(),

    hoursTitle: z.string().max(50).optional().default('Opening Hours'),
    hours: z.array(z.object({
        day: z.string().max(50),
        time: z.string().max(50)
    })).max(7).optional().default([]),

    reviewsTitle: z.string().max(50).optional().default('Customer Reviews'),
    reviews: z.array(z.object({
        text: z.string().max(500),
        name: z.string().max(100),
        rating: z.number().min(1).max(5)
    })).max(10).optional().default([]),

    galleryTitle: z.string().max(50).optional().default('Gallery'),
    gallery: z.array(z.string()).max(10).optional().default([])
});

export const ServiceCoSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Company name is required').max(100),
    tagline: z.string().min(1, 'Tagline is required').max(200),

    // Optional fields
    servicesTitle: z.string().max(50).optional().default('Our Services'),
    services: z.array(z.object({
        title: z.string().max(100),
        desc: z.string().max(200)
    })).max(10).optional().default([]),

    resultsTitle: z.string().max(50).optional().default('Our Results'),
    results: z.array(z.object({
        metric: z.string().max(50),
        value: z.string().max(50)
    })).max(5).optional().default([]),

    clientsTitle: z.string().max(50).optional().default('Trusted By'),
    clients: z.array(z.string()).max(20).optional().default([]),
    ctaLink: z.string().url().optional().or(z.literal(''))
});

export const EcoBrandSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Brand name is required').max(100),
    mission: z.string().min(1, 'Mission is required').max(500),

    // Optional fields
    impactTitle: z.string().max(50).optional().default('Our Impact'),
    impact: z.array(z.object({
        metric: z.string().max(50),
        value: z.string().max(50)
    })).max(5).optional().default([]),

    valuesTitle: z.string().max(50).optional().default('Our Values'),
    values: z.array(z.object({
        title: z.string().max(100),
        desc: z.string().max(200)
    })).max(10).optional().default([]),
    ctaLink: z.string().url().optional().or(z.literal(''))
});

export const EventSpaceSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Venue name is required').max(100),
    location: z.string().min(1, 'Location is required').max(100),
    email: z.string().email('Valid email is required'),

    // Optional fields
    capacity: z.string().max(50).optional(),

    amenitiesTitle: z.string().max(50).optional().default('Amenities'),
    amenities: z.array(z.string()).max(20).optional().default([]),

    galleryTitle: z.string().max(50).optional().default('Gallery'),
    gallery: z.array(z.string()).max(10).optional().default([]),
    pricing: z.string().max(200).optional(),
    bookingLink: z.string().url().optional().or(z.literal(''))
});

export const FranchiseHubSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Brand name is required').max(100),
    tagline: z.string().min(1, 'Tagline is required').max(200),

    // Optional fields
    locationsTitle: z.string().max(50).optional().default('Our Locations'),
    locations: z.array(z.object({
        city: z.string().max(100),
        address: z.string().max(200),
        phone: z.string().max(50)
    })).max(20).optional().default([]),
    aboutBrand: z.string().max(1000).optional(),
    franchiseLink: z.string().url().optional().or(z.literal(''))
});

export const LegacyCoSchema = z.object({
    config_version: z.literal('v1'),
    // Required hero fields
    name: z.string().min(1, 'Company name is required').max(100),
    about: z.string().min(1, 'About is required').max(500),
    email: z.string().email('Valid email is required'),

    // Optional fields
    foundedYear: z.string().max(10).optional(),
    tagline: z.string().max(200).optional(),

    timelineTitle: z.string().max(50).optional().default('Our History'),
    timeline: z.array(z.object({
        year: z.string().max(10),
        event: z.string().max(200)
    })).max(20).optional().default([]),

    valuesTitle: z.string().max(50).optional().default('Core Values'),
    values: z.array(z.object({
        title: z.string().max(100),
        desc: z.string().max(200)
    })).max(10).optional().default([]),

    awardsTitle: z.string().max(50).optional().default('Awards & Recognition'),
    awards: z.array(z.string()).max(10).optional().default([])
});

// ============================================================================
// Export theme schemas map
// ============================================================================

export const THEME_SCHEMAS = {
    // Freelancers
    quickpitch: QuickPitchSchema,
    skillstack: SkillStackSchema,
    hiremenow: HireMeNowSchema,
    storybuilder: StoryBuilderSchema,
    localpro: LocalProSchema,
    sidehustle: SideHustleSchema,

    // Portfolios
    gallerygrid: GalleryGridSchema,
    casestudy: CaseStudySchema,
    minimalistcv: MinimalistCVSchema,
    motionreel: MotionReelSchema,
    interactivedemo: InteractiveDemoSchema,
    narrativescroll: NarrativeScrollSchema,

    // Products
    launchpad: LaunchPadSchema,
    featurefocus: FeatureFocusSchema,
    digitaldownload: DigitalDownloadSchema,
    hardwareshowcase: HardwareShowcaseSchema,
    opensource: OpenSourceSchema,
    nichetool: NicheToolSchema,

    // Businesses
    localbiz: LocalBizSchema,
    serviceco: ServiceCoSchema,
    ecobrand: EcoBrandSchema,
    eventspace: EventSpaceSchema,
    franchisehub: FranchiseHubSchema,
    legacyco: LegacyCoSchema
};

export const validateThemeData = (themeId, data) => {
    const schema = THEME_SCHEMAS[themeId];
    if (!schema) {
        throw new Error(`Unknown theme: ${themeId}`);
    }
    return schema.parse(data);
};
