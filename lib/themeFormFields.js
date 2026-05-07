/**
 * Theme Form Field Definitions
 * Maps each theme to its form fields with proper types, labels, and validation
 */

export const THEME_FORM_FIELDS = {
    // ============================================================================
    // FREELANCER THEMES
    // ============================================================================
    quickpitch: [
        { name: 'name', type: 'text', required: true, label: 'Your Name', placeholder: 'John Doe', maxLength: 100 },
        { name: 'headline', type: 'text', required: true, label: 'Headline', placeholder: 'Your main pitch', maxLength: 100 },
        { name: 'subhead', type: 'text', required: true, label: 'Subheadline', placeholder: 'Supporting message', maxLength: 300 },
        { name: 'email', type: 'email', required: true, label: 'Email', placeholder: 'your@email.com' },
        { name: 'calendlyUrl', type: 'url', required: false, label: 'Calendly URL', placeholder: 'https://calendly.com/yourname', helperText: 'Optional: Add your booking link' },

        { name: 'servicesTitle', type: 'text', required: false, label: 'Services Section Title', placeholder: 'My Services', defaultValue: 'My Services' },
        {
            name: 'services',
            type: 'array',
            required: false,
            label: 'Services',
            maxItems: 3,
            itemFields: [
                { name: 'title', type: 'text', label: 'Service Name', maxLength: 100 },
                { name: 'desc', type: 'textarea', label: 'Description', maxLength: 500 }
            ]
        },

        { name: 'testimonialsTitle', type: 'text', required: false, label: 'Testimonials Section Title', placeholder: 'What Clients Say', defaultValue: 'What Clients Say' },
        {
            name: 'testimonials',
            type: 'array',
            required: false,
            label: 'Testimonials',
            maxItems: 3,
            itemFields: [
                { name: 'quote', type: 'textarea', label: 'Quote', maxLength: 500 },
                { name: 'name', type: 'text', label: 'Client Name', maxLength: 100 },
                { name: 'role', type: 'text', label: 'Client Role', maxLength: 100 }
            ]
        }
    ],

    skillstack: [
        { name: 'name', type: 'text', required: true, label: 'Full Name', placeholder: 'Jane Doe', maxLength: 100 },
        { name: 'bio', type: 'textarea', required: true, label: 'Bio', placeholder: 'Tell us about yourself...', maxLength: 500 },
        { name: 'email', type: 'email', required: true, label: 'Email', placeholder: 'your@email.com' },
        { name: 'resumeUrl', type: 'url', required: false, label: 'Resume URL', placeholder: 'https://...', helperText: 'Link to your resume/CV' },
        { name: 'github', type: 'url', required: false, label: 'GitHub URL', placeholder: 'https://github.com/username' },
        { name: 'linkedin', type: 'url', required: false, label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/username' },

        { name: 'skillsTitle', type: 'text', required: false, label: 'Skills Section Title', placeholder: 'Technical Skills', defaultValue: 'Technical Skills' },
        {
            name: 'skills',
            type: 'array',
            required: false,
            label: 'Skills',
            maxItems: 10,
            itemFields: [
                { name: 'name', type: 'text', label: 'Skill Name', maxLength: 50 },
                { name: 'level', type: 'number', label: 'Proficiency (0-100)', min: 0, max: 100 }
            ]
        },

        { name: 'projectsTitle', type: 'text', required: false, label: 'Projects Section Title', placeholder: 'Featured Projects', defaultValue: 'Featured Projects' },
        {
            name: 'projects',
            type: 'array',
            required: false,
            label: 'Projects',
            maxItems: 6,
            itemFields: [
                { name: 'title', type: 'text', label: 'Project Title', maxLength: 100 },
                { name: 'desc', type: 'textarea', label: 'Description', maxLength: 1000 },
                { name: 'image', type: 'text', label: 'Image URL (optional)', placeholder: 'https://...' },
                { name: 'tech', type: 'tags', label: 'Technologies', placeholder: 'React, Node.js, etc.', helperText: 'Separate items with commas' }
            ]
        }
    ],

    hiremenow: [
        { name: 'name', type: 'text', required: true, label: 'Full Name', placeholder: 'Alex Smith', maxLength: 100 },
        { name: 'available', type: 'boolean', required: true, label: 'Currently Available', defaultValue: true },
        { name: 'email', type: 'email', required: false, label: 'Email', placeholder: 'your@email.com' },
        { name: 'calendlyUrl', type: 'url', required: false, label: 'Booking URL', placeholder: 'https://calendly.com/yourname' },
        {
            name: 'offer',
            type: 'object',
            required: false,
            label: 'Limited Time Offer',
            fields: [
                { name: 'title', type: 'text', label: 'Offer Title', maxLength: 100 },
                { name: 'desc', type: 'textarea', label: 'Description', maxLength: 500 },
                { name: 'expiry', type: 'date', label: 'Expiry Date' }
            ]
        },

        { name: 'pricingTitle', type: 'text', required: false, label: 'Pricing Section Title', placeholder: 'Services & Pricing', defaultValue: 'Services & Pricing' },
        {
            name: 'pricingTiers',
            type: 'array',
            required: false,
            label: 'Pricing Tiers',
            maxItems: 3,
            itemFields: [
                { name: 'name', type: 'text', label: 'Tier Name', maxLength: 50 },
                { name: 'price', type: 'text', label: 'Price', maxLength: 50, placeholder: '$99/hr' },
                { name: 'features', type: 'tags', label: 'Features', placeholder: 'Feature 1, Feature 2', helperText: 'Separate items with commas' }
            ]
        },

        { name: 'calendarTitle', type: 'text', required: false, label: 'Calendar Section Title', placeholder: 'Availability', defaultValue: 'Availability' }
    ],

    storybuilder: [
        { name: 'name', type: 'text', required: true, label: 'Your Name', placeholder: 'Sarah Jones', maxLength: 100 },
        { name: 'manifesto', type: 'textarea', required: true, label: 'Your Philosophy/Manifesto', placeholder: 'What drives you...', maxLength: 500 },
        { name: 'ctaText', type: 'text', required: false, label: 'Call to Action Text', maxLength: 50, placeholder: "Let's Work Together" },
        { name: 'ctaLink', type: 'url', required: false, label: 'CTA Link', placeholder: 'https://...' },
        {
            name: 'storyBlocks',
            type: 'array',
            required: false,
            label: 'Story Blocks',
            maxItems: 10,
            itemFields: [
                { name: 'type', type: 'select', label: 'Block Type', options: ['text', 'image'] },
                { name: 'content', type: 'textarea', label: 'Content', maxLength: 1000 }
            ]
        },

        { name: 'caseSnippetsTitle', type: 'text', required: false, label: 'Cases Section Title', placeholder: 'Client Transformations', defaultValue: 'Client Transformations' },
        {
            name: 'caseSnippets',
            type: 'array',
            required: false,
            label: 'Before/After Case Studies',
            maxItems: 5,
            itemFields: [
                { name: 'title', type: 'text', label: 'Case Title', maxLength: 100 },
                { name: 'before', type: 'textarea', label: 'Before', maxLength: 500 },
                { name: 'after', type: 'textarea', label: 'After', maxLength: 500 }
            ]
        }
    ],

    localpro: [
        { name: 'name', type: 'text', required: true, label: 'Business/Pro Name', placeholder: "Bob's Plumbing", maxLength: 100 },
        { name: 'serviceArea', type: 'text', required: true, label: 'Service Area', placeholder: 'Austin, TX', maxLength: 100 },
        { name: 'phone', type: 'tel', required: true, label: 'Phone Number', placeholder: '(512) 555-0123' },
        { name: 'email', type: 'email', required: true, label: 'Email', placeholder: 'your@email.com' },
        { name: 'since', type: 'text', required: false, label: 'In Business Since', placeholder: '2010', maxLength: 10 },
        { name: 'mapEmbedUrl', type: 'url', required: false, label: 'Google Maps Embed URL', helperText: 'Optional: Embed a map of your location' },
        { name: 'galleryTitle', type: 'text', required: false, label: 'Gallery Section Title', placeholder: 'Our Work', defaultValue: 'Our Work' },
        {
            name: 'gallery',
            type: 'array',
            required: false,
            label: 'Project Gallery',
            maxItems: 8,
            itemFields: [
                { name: 'location', type: 'text', label: 'Location', maxLength: 100 },
                { name: 'alt', type: 'text', label: 'Description', maxLength: 100 },
                { name: 'url', type: 'text', label: 'Image URL (optional)', placeholder: 'https://...' }
            ]
        },

        { name: 'reviewsTitle', type: 'text', required: false, label: 'Reviews Section Title', placeholder: 'Customer Reviews', defaultValue: 'Customer Reviews' },
        {
            name: 'reviews',
            type: 'array',
            required: false,
            label: 'Customer Reviews',
            maxItems: 6,
            itemFields: [
                { name: 'text', type: 'textarea', label: 'Review', maxLength: 500 },
                { name: 'name', type: 'text', label: 'Customer Name', maxLength: 100 },
                { name: 'location', type: 'text', label: 'Location', maxLength: 100 },
                { name: 'rating', type: 'number', label: 'Rating (1-5)', min: 1, max: 5 }
            ]
        },

        { name: 'faqTitle', type: 'text', required: false, label: 'FAQ Section Title', placeholder: 'FAQ', defaultValue: 'FAQ' },
        {
            name: 'faq',
            type: 'array',
            required: false,
            label: 'FAQ',
            maxItems: 10,
            itemFields: [
                { name: 'q', type: 'text', label: 'Question', maxLength: 200 },
                { name: 'a', type: 'textarea', label: 'Answer', maxLength: 500 }
            ]
        },

        { name: 'mapTitle', type: 'text', required: false, label: 'Map Section Title', placeholder: 'Service Area', defaultValue: 'Service Area' }
    ],

    sidehustle: [
        { name: 'name', type: 'text', required: true, label: 'Name/Handle', placeholder: 'Creative Coder', maxLength: 100 },
        { name: 'intro', type: 'text', required: true, label: 'Introduction', placeholder: 'Hey! I do...', maxLength: 300 },
        { name: 'email', type: 'email', required: true, label: 'Email', placeholder: 'your@email.com' },
        { name: 'offersTitle', type: 'text', required: false, label: 'Offers Section Title', placeholder: 'What I Offer', defaultValue: 'What I Offer' },
        {
            name: 'offers',
            type: 'array',
            required: false,
            label: 'What You Offer',
            maxItems: 6,
            itemFields: [
                { name: 'title', type: 'text', label: 'Service', maxLength: 50 },
                { name: 'emoji', type: 'text', label: 'Emoji', maxLength: 10, placeholder: '🎨' },
                { name: 'desc', type: 'textarea', label: 'Description', maxLength: 500 }
            ]
        },

        { name: 'funFactsTitle', type: 'text', required: false, label: 'Fun Stats Section Title', placeholder: 'Fun Facts', defaultValue: 'Fun Facts' },
        {
            name: 'funFacts',
            type: 'array',
            required: false,
            label: 'Fun Stats',
            maxItems: 5,
            itemFields: [
                { name: 'label', type: 'text', label: 'Label', maxLength: 50 },
                { name: 'value', type: 'text', label: 'Value', maxLength: 20 }
            ]
        },
        { name: 'purchaseLink', type: 'url', required: false, label: 'Buy Link', placeholder: 'https://...' },

        { name: 'specsTitle', type: 'text', required: false, label: 'Specs Section Title', placeholder: 'Tech Specs', defaultValue: 'Tech Specs' },
        {
            name: 'specs',
            type: 'array',
            required: false,
            label: 'Tech Specs',
            maxItems: 6,
            itemFields: [
                { name: 'label', type: 'text', label: 'Spec Label', maxLength: 50 },
                { name: 'value', type: 'text', label: 'Value', maxLength: 50 }
            ]
        },

        { name: 'variantsTitle', type: 'text', required: false, label: 'Variants Section Title', placeholder: 'Available Options', defaultValue: 'Available Options' },
        {
            name: 'variants',
            type: 'array',
            required: false,
            label: 'Variants',
            maxItems: 10,
            itemFields: [
                { name: 'name', type: 'text', label: 'Variant Name', maxLength: 50 },
                { name: 'inStock', type: 'boolean', label: 'In Stock', defaultValue: true }
            ]
        },
        {
            name: 'socials',
            type: 'object',
            required: false,
            label: 'Social Links',
            fields: [
                { name: 'instagram', type: 'url', label: 'Instagram', placeholder: 'https://instagram.com/username' },
                { name: 'twitter', type: 'url', label: 'Twitter', placeholder: 'https://twitter.com/username' },
                { name: 'linkedin', type: 'url', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' }
            ]
        }
    ],

    // ============================================================================
    // PORTFOLIO THEMES
    // ============================================================================
    gallerygrid: [
        { name: 'name', type: 'text', required: true, label: 'Artist Name', placeholder: 'Maria Garcia', maxLength: 100 },
        { name: 'intro', type: 'textarea', required: true, label: 'Introduction', placeholder: 'Tell visitors about your work...', maxLength: 500 },
        { name: 'email', type: 'email', required: true, label: 'Email', placeholder: 'your@email.com' },
        { name: 'about', type: 'textarea', required: false, label: 'About Section', maxLength: 500 },
        { name: 'instagram', type: 'text', required: false, label: 'Instagram Handle', placeholder: '@username', maxLength: 50 },
        { name: 'instagram', type: 'text', required: false, label: 'Instagram Handle', placeholder: '@username', maxLength: 50 },

        { name: 'projectsTitle', type: 'text', required: false, label: 'Projects Section Title', placeholder: 'My Work', defaultValue: 'My Work' },
        {
            name: 'projects',
            type: 'array',
            required: false,
            label: 'Projects',
            maxItems: 20,
            itemFields: [
                { name: 'title', type: 'text', label: 'Title', maxLength: 100 },
                { name: 'category', type: 'text', label: 'Category', maxLength: 50 },
                { name: 'tags', type: 'tags', label: 'Tags', placeholder: 'portrait, nature, etc.', helperText: 'Separate items with commas' },
                { name: 'featured', type: 'text', label: 'Image/Emoji', placeholder: '📸 or https://...' }
            ]
        },

        { name: 'aboutTitle', type: 'text', required: false, label: 'About Section Title', placeholder: 'About Me', defaultValue: 'About Me' }
    ],

    casestudy: [
        { name: 'name', type: 'text', required: true, label: 'Your Name', placeholder: 'David Chen', maxLength: 100 },
        { name: 'intro', type: 'textarea', required: true, label: 'Introduction', placeholder: 'What you do...', maxLength: 500 },
        { name: 'email', type: 'email', required: true, label: 'Email', placeholder: 'your@email.com' },
        { name: 'docsUrl', type: 'url', required: false, label: 'Portfolio/Docs URL', placeholder: 'https://...' },
        { name: 'docsUrl', type: 'url', required: false, label: 'Portfolio/Docs URL', placeholder: 'https://...' },

        { name: 'toolsTitle', type: 'text', required: false, label: 'Tools Section Title', placeholder: 'Tools & Tech', defaultValue: 'Tools & Tech' },
        {
            name: 'tools',
            type: 'tags',
            required: false,
            label: 'Tools & Technologies',
            placeholder: 'Figma, React, etc.',
            helperText: 'Separate items with commas'
        },

        { name: 'caseStudiesTitle', type: 'text', required: false, label: 'Cases Section Title', placeholder: 'Case Studies', defaultValue: 'Case Studies' },
        {
            name: 'caseStudies',
            type: 'array',
            required: false,
            label: 'Case Studies',
            maxItems: 5,
            itemFields: [
                { name: 'title', type: 'text', label: 'Project Title', maxLength: 100 },
                { name: 'heroImage', type: 'text', label: 'Hero Image URL (optional)', placeholder: 'https://...' },
                { name: 'challenge', type: 'textarea', label: 'Challenge', maxLength: 1000 },
                { name: 'process', type: 'textarea', label: 'Process', maxLength: 1000 },
                { name: 'solution', type: 'textarea', label: 'Solution', maxLength: 1000 },
                {
                    name: 'results',
                    type: 'subarray',
                    label: 'Results',
                    maxItems: 5,
                    itemFields: [
                        { name: 'metric', type: 'text', label: 'Metric', maxLength: 50 },
                        { name: 'value', type: 'text', label: 'Value', maxLength: 50 }
                    ]
                }
            ]
        }
    ],

    minimalistcv: [
        { name: 'name', type: 'text', required: true, label: 'Full Name', maxLength: 100 },
        { name: 'role', type: 'text', required: true, label: 'Role/Title', maxLength: 100 },
        { name: 'headline', type: 'text', required: true, label: 'Headline', maxLength: 300 },
        { name: 'email', type: 'email', required: true, label: 'Email', placeholder: 'your@email.com' },
        { name: 'resumeUrl', type: 'url', required: false, label: 'Resume PDF URL', placeholder: 'https://...' },
        { name: 'resumeUrl', type: 'url', required: false, label: 'Resume PDF URL', placeholder: 'https://...' },
        {
            name: 'featuredProject',
            type: 'object',
            required: false,
            label: 'Featured Project',
            fields: [
                { name: 'title', type: 'text', label: 'Title', maxLength: 100 },
                { name: 'link', type: 'url', label: 'Link' },
                { name: 'image', type: 'text', label: 'Image URL (optional)', placeholder: 'https://...' },
                { name: 'desc', type: 'textarea', label: 'Description', maxLength: 1000 }
            ]
        },

        { name: 'skillsTitle', type: 'text', required: false, label: 'Skills Section Title', placeholder: 'Expertise', defaultValue: 'Expertise' },
        {
            name: 'skills',
            type: 'array',
            required: false,
            label: 'Skills',
            maxItems: 10,
            itemFields: [
                { name: 'name', type: 'text', label: 'Skill', maxLength: 50 },
                { name: 'proficiency', type: 'number', label: 'Proficiency (0-100)', min: 0, max: 100 }
            ]
        },

        { name: 'experienceTitle', type: 'text', required: false, label: 'Experience Section Title', placeholder: 'Experience', defaultValue: 'Experience' },
        {
            name: 'experience',
            type: 'array',
            required: false,
            label: 'Work Experience',
            maxItems: 10,
            itemFields: [
                { name: 'company', type: 'text', label: 'Company', maxLength: 100 },
                { name: 'role', type: 'text', label: 'Role', maxLength: 100 },
                { name: 'dates', type: 'text', label: 'Dates', maxLength: 50, placeholder: '2020 - 2023' },
                { name: 'bullets', type: 'tags', label: 'Key Achievements', placeholder: 'Achievement 1, Achievement 2', helperText: 'Separate items with commas' }
            ]
        },

        { name: 'educationTitle', type: 'text', required: false, label: 'Education Section Title', placeholder: 'Education', defaultValue: 'Education' },
        {
            name: 'education',
            type: 'array',
            required: false,
            label: 'Education',
            maxItems: 5,
            itemFields: [
                { name: 'school', type: 'text', label: 'School', maxLength: 100 },
                { name: 'degree', type: 'text', label: 'Degree', maxLength: 100 },
                { name: 'year', type: 'text', label: 'Year', maxLength: 10 }
            ]
        }
    ],

    motionreel: [
        { name: 'name', type: 'text', required: true, label: 'Creator Name', placeholder: 'Sam Director', maxLength: 100 },
        { name: 'email', type: 'email', required: true, label: 'Email', placeholder: 'your@email.com' },
        {
            name: 'heroReel',
            type: 'object',
            required: false,
            label: 'Hero Reel',
            fields: [
                { name: 'url', type: 'url', label: 'Video URL (optional)', placeholder: 'https://...' },
                { name: 'poster', type: 'text', label: 'Poster Image URL (optional)', placeholder: 'https://...' }
            ]
        },

        { name: 'projectsTitle', type: 'text', required: false, label: 'Projects Section Title', placeholder: 'Featured Work', defaultValue: 'Featured Work' },
        {
            name: 'projects',
            type: 'array',
            required: false,
            label: 'Video Projects',
            maxItems: 12,
            itemFields: [
                { name: 'title', type: 'text', label: 'Title', maxLength: 100 },
                { name: 'thumbnail', type: 'text', label: 'Thumbnail URL (optional)', placeholder: 'https://...' },
                { name: 'videoUrl', type: 'url', label: 'Video URL (optional)', placeholder: 'https://...' },
                { name: 'duration', type: 'text', label: 'Duration', maxLength: 10, placeholder: '2:30' }
            ]
        },

        { name: 'btsTitle', type: 'text', required: false, label: 'BTS Section Title', placeholder: 'Behind the Scenes', defaultValue: 'Behind the Scenes' },
        {
            name: 'bts',
            type: 'array',
            required: false,
            label: 'Behind the Scenes',
            maxItems: 6,
            itemFields: [
                { name: 'caption', type: 'textarea', label: 'Caption', maxLength: 500 },
                { name: 'media', type: 'text', label: 'Image/Video URL (optional)', placeholder: 'https://...' }
            ]
        }
    ],

    interactivedemo: [
        { name: 'name', type: 'text', required: true, label: 'Developer Name', placeholder: 'Dev Wizard', maxLength: 100 },
        { name: 'githubUrl', type: 'url', required: false, label: 'GitHub URL', placeholder: 'https://github.com/username' },
        {
            name: 'heroDemo',
            type: 'object',
            required: false,
            label: 'Hero Demo',
            fields: [
                { name: 'url', type: 'url', label: 'Demo URL (optional)', placeholder: 'https://...' },
                { name: 'title', type: 'text', label: 'Title', maxLength: 100 }
            ]
        },

        { name: 'demosTitle', type: 'text', required: false, label: 'Demos Section Title', placeholder: 'Interactive Demos', defaultValue: 'Interactive Demos' },
        {
            name: 'demos',
            type: 'array',
            required: false,
            label: 'Interactive Demos',
            maxItems: 10,
            itemFields: [
                { name: 'title', type: 'text', label: 'Title', maxLength: 100 },
                { name: 'embedUrl', type: 'url', label: 'Embed URL (optional)', placeholder: 'https://codepen.io/...' },
                { name: 'tech', type: 'tags', label: 'Technologies', placeholder: 'WebGL, Three.js, etc.', helperText: 'Separate items with commas' }
            ]
        },

        { name: 'snippetsTitle', type: 'text', required: false, label: 'Snippets Section Title', placeholder: 'Code Snippets', defaultValue: 'Code Snippets' },
        {
            name: 'snippets',
            type: 'array',
            required: false,
            label: 'Code Snippets',
            maxItems: 10,
            itemFields: [
                { name: 'language', type: 'text', label: 'Language', maxLength: 50, placeholder: 'javascript' },
                { name: 'code', type: 'textarea', label: 'Code', maxLength: 2000 }
            ]
        }
    ],

    narrativescroll: [
        { name: 'name', type: 'text', required: true, label: 'Title/Name', placeholder: 'My Journey', maxLength: 100 },
        {
            name: 'epilogue',
            type: 'object',
            required: true,
            label: 'Epilogue (Final Section)',
            fields: [
                { name: 'text', type: 'textarea', label: 'Epilogue Text', maxLength: 500 },
                { name: 'ctaText', type: 'text', label: 'CTA Button Text', maxLength: 100 },
                { name: 'ctaLink', type: 'url', label: 'CTA Link', placeholder: 'https://...' }
            ]
        },

        {
            name: 'chapters',
            type: 'array',
            required: false,
            label: 'Story Chapters',
            maxItems: 10,
            itemFields: [
                { name: 'title', type: 'text', label: 'Chapter Title', maxLength: 50 },
                { name: 'body', type: 'textarea', label: 'Chapter Content', maxLength: 1000 },
                { name: 'bgImage', type: 'text', label: 'Background Image URL (optional)', placeholder: 'https://...' }
            ]
        },

        { name: 'artifactsTitle', type: 'text', required: false, label: 'Artifacts Section Title', placeholder: 'Selected Artifacts', defaultValue: 'Selected Artifacts' },
        {
            name: 'artifacts',
            type: 'array',
            required: false,
            label: 'Portfolio Artifacts',
            maxItems: 10,
            itemFields: [
                { name: 'title', type: 'text', label: 'Title', maxLength: 100 },
                { name: 'link', type: 'url', label: 'Link' }
            ]
        }
    ],
    // ============================================================================
    // BUSINESS THEMES
    // ============================================================================
    ecobrand: [
        { name: 'name', type: 'text', required: true, label: 'Brand Name', placeholder: 'GreenLeaf', maxLength: 100 },
        { name: 'tagline', type: 'text', required: true, label: 'Tagline', placeholder: 'Sustainability First', maxLength: 100 },
        { name: 'mission', type: 'textarea', required: true, label: 'Mission Statement', maxLength: 300 },
        { name: 'email', type: 'email', required: true, label: 'Contact Email', placeholder: 'hello@eco.com' },
        { name: 'impactTitle', type: 'text', required: false, label: 'Impact Section Title', placeholder: 'Our Impact', defaultValue: 'Our Impact' },
        {
            name: 'stats',
            type: 'array',
            required: false,
            label: 'Impact Stats',
            maxItems: 4,
            itemFields: [
                { name: 'value', type: 'text', label: 'Value', maxLength: 50 },
                { name: 'label', type: 'text', label: 'Label', maxLength: 50 }
            ]
        },

        { name: 'valuesTitle', type: 'text', required: false, label: 'Values Section Title', placeholder: 'Our Values', defaultValue: 'Our Values' },
        {
            name: 'values',
            type: 'array',
            required: false,
            label: 'Core Values',
            maxItems: 4,
            itemFields: [
                { name: 'title', type: 'text', label: 'Value', maxLength: 100 },
                { name: 'desc', type: 'textarea', label: 'Description', maxLength: 200 }
            ]
        }
    ],

    eventspace: [
        { name: 'name', type: 'text', required: true, label: 'Venue Name', placeholder: 'The Grand Hall', maxLength: 100 },
        { name: 'location', type: 'text', required: true, label: 'Location', placeholder: 'New York, NY', maxLength: 100 },
        { name: 'capacity', type: 'text', required: false, label: 'Capacity', placeholder: 'Up to 500 guests', maxLength: 50 },
        { name: 'email', type: 'email', required: true, label: 'Booking Email', placeholder: 'book@venue.com' },
        { name: 'email', type: 'email', required: true, label: 'Booking Email', placeholder: 'book@venue.com' },

        { name: 'amenitiesTitle', type: 'text', required: false, label: 'Amenities Section Title', placeholder: 'Amenities', defaultValue: 'Amenities' },
        {
            name: 'amenities',
            type: 'tags',
            required: false,
            label: 'Amenities',
            placeholder: 'WiFi, Catering, AV Equipment',
            helperText: 'Separate items with commas'
        },

        { name: 'galleryTitle', type: 'text', required: false, label: 'Gallery Section Title', placeholder: 'Gallery', defaultValue: 'Gallery' },
        {
            name: 'gallery',
            type: 'array',
            required: false,
            label: 'Photo Gallery',
            maxItems: 8,
            itemFields: [
                { name: 'url', type: 'text', label: 'Image URL (optional)', placeholder: 'https://...' },
                { name: 'caption', type: 'text', label: 'Caption', maxLength: 100 }
            ]
        }
    ],

    franchisehub: [
        { name: 'name', type: 'text', required: true, label: 'Franchise Name', placeholder: 'Burger Joint', maxLength: 100 },
        { name: 'tagline', type: 'text', required: true, label: 'Tagline', maxLength: 100 },
        { name: 'investmentRange', type: 'text', required: false, label: 'Investment Range', placeholder: '$50k - $100k', maxLength: 100 },
        { name: 'email', type: 'email', required: true, label: 'Inquiry Email', placeholder: 'franchise@brand.com' },
        { name: 'email', type: 'email', required: true, label: 'Inquiry Email', placeholder: 'franchise@brand.com' },

        { name: 'benefitsTitle', type: 'text', required: false, label: 'Benefits Section Title', placeholder: 'Franchise Benefits', defaultValue: 'Franchise Benefits' },
        {
            name: 'benefits',
            type: 'array',
            required: false,
            label: 'Franchise Benefits',
            maxItems: 6,
            itemFields: [
                { name: 'title', type: 'text', label: 'Benefit', maxLength: 100 },
                { name: 'desc', type: 'textarea', label: 'Description', maxLength: 500 }
            ]
        },

        { name: 'locationsTitle', type: 'text', required: false, label: 'Locations Section Title', placeholder: 'Our Locations', defaultValue: 'Our Locations' },
        {
            name: 'locations',
            type: 'array',
            required: false,
            label: 'Locations',
            maxItems: 20,
            itemFields: [
                { name: 'city', type: 'text', label: 'City', maxLength: 100 },
                { name: 'address', type: 'text', label: 'Address', maxLength: 200 },
                { name: 'phone', type: 'text', label: 'Phone', maxLength: 50 }
            ]
        }
    ],

    legacyco: [
        { name: 'name', type: 'text', required: true, label: 'Company Name', placeholder: 'Smith & Sons', maxLength: 100 },
        { name: 'foundedYear', type: 'text', required: false, label: 'Founded Year', placeholder: '1985', maxLength: 10 },
        { name: 'about', type: 'textarea', required: true, label: 'About Us', maxLength: 500 },
        { name: 'email', type: 'email', required: true, label: 'Contact Email', placeholder: 'info@legacy.com' },
        { name: 'email', type: 'email', required: true, label: 'Contact Email', placeholder: 'info@legacy.com' },

        { name: 'valuesTitle', type: 'text', required: false, label: 'Values Section Title', placeholder: 'Core Values', defaultValue: 'Core Values' },
        {
            name: 'values',
            type: 'array',
            required: false,
            label: 'Core Values',
            maxItems: 4,
            itemFields: [
                { name: 'title', type: 'text', label: 'Value', maxLength: 50 },
                { name: 'desc', type: 'textarea', label: 'Description', maxLength: 500 }
            ]
        },

        { name: 'timelineTitle', type: 'text', required: false, label: 'Timeline Section Title', placeholder: 'Our History', defaultValue: 'Our History' },
        {
            name: 'timeline',
            type: 'array',
            required: false,
            label: 'Company History',
            maxItems: 20,
            itemFields: [
                { name: 'year', type: 'text', label: 'Year', maxLength: 10 },
                { name: 'event', type: 'text', label: 'Event', maxLength: 200 }
            ]
        },

        { name: 'awardsTitle', type: 'text', required: false, label: 'Awards Section Title', placeholder: 'Awards & Recognition', defaultValue: 'Awards & Recognition' },
        {
            name: 'awards',
            type: 'tags',
            required: false,
            label: 'Awards',
            placeholder: 'Best of 2024, Service Award',
            helperText: 'Separate items with commas'
        }
    ],

    localbiz: [
        { name: 'name', type: 'text', required: true, label: 'Business Name', placeholder: 'Downtown Cafe', maxLength: 100 },
        { name: 'category', type: 'text', required: true, label: 'Category', placeholder: 'Coffee Shop', maxLength: 50 },
        { name: 'address', type: 'text', required: true, label: 'Address', maxLength: 200 },
        { name: 'phone', type: 'tel', required: false, label: 'Phone', placeholder: '(555) 123-4567' },
        { name: 'email', type: 'email', required: true, label: 'Email', placeholder: 'hello@local.com' },
        { name: 'hoursTitle', type: 'text', required: false, label: 'Hours Section Title', placeholder: 'Opening Hours', defaultValue: 'Opening Hours' },
        {
            name: 'hours',
            type: 'array',
            required: false,
            label: 'Opening Hours',
            maxItems: 7,
            itemFields: [
                { name: 'day', type: 'text', label: 'Day', maxLength: 20 },
                { name: 'time', type: 'text', label: 'Time', maxLength: 50 }
            ]
        }
    ],

    serviceco: [
        { name: 'name', type: 'text', required: true, label: 'Company Name', placeholder: 'Elite Services', maxLength: 100 },
        { name: 'tagline', type: 'text', required: true, label: 'Tagline', maxLength: 100 },
        { name: 'email', type: 'email', required: true, label: 'Email', placeholder: 'info@service.com' },
        { name: 'email', type: 'email', required: true, label: 'Email', placeholder: 'info@service.com' },

        { name: 'servicesTitle', type: 'text', required: false, label: 'Services Section Title', placeholder: 'Services', defaultValue: 'Services' },
        {
            name: 'services',
            type: 'array',
            required: false,
            label: 'Services',
            maxItems: 6,
            itemFields: [
                { name: 'title', type: 'text', label: 'Service Name', maxLength: 100 },
                { name: 'desc', type: 'textarea', label: 'Description', maxLength: 500 },
                { name: 'icon', type: 'text', label: 'Icon (emoji)', maxLength: 5 }
            ]
        },

        { name: 'resultsTitle', type: 'text', required: false, label: 'Results Section Title', placeholder: 'Our Results', defaultValue: 'Our Results' },
        {
            name: 'results',
            type: 'array',
            required: false,
            label: 'Results Specs',
            maxItems: 5,
            itemFields: [
                { name: 'metric', type: 'text', label: 'Metric', maxLength: 50 },
                { name: 'value', type: 'text', label: 'Value', maxLength: 50 }
            ]
        },

        { name: 'clientsTitle', type: 'text', required: false, label: 'Clients Section Title', placeholder: 'Trusted By', defaultValue: 'Trusted By' },
        {
            name: 'clients',
            type: 'tags',
            required: false,
            label: 'Client Names',
            placeholder: 'Microsoft, Google, etc.',
            helperText: 'Separate items with commas'
        },

        { name: 'testimonialsTitle', type: 'text', required: false, label: 'Testimonials Section Title', placeholder: 'Testimonials', defaultValue: 'Testimonials' },
        {
            name: 'testimonials',
            type: 'array',
            required: false,
            label: 'Testimonials',
            maxItems: 3,
            itemFields: [
                { name: 'text', type: 'textarea', label: 'Review', maxLength: 300 },
                { name: 'author', type: 'text', label: 'Author', maxLength: 100 }
            ]
        }
    ],

    // ============================================================================
    // PRODUCT THEMES
    // ============================================================================
    digitaldownload: [
        { name: 'name', type: 'text', required: true, label: 'Product Name', placeholder: 'Pro Presets Pack', maxLength: 100 },
        { name: 'price', type: 'text', required: true, label: 'Price', placeholder: '$29', maxLength: 20 },
        { name: 'desc', type: 'textarea', required: true, label: 'Description', maxLength: 500 },
        { name: 'fileType', type: 'text', required: false, label: 'File Type', placeholder: 'ZIP, PDF, etc.', maxLength: 20 },
        { name: 'purchaseLink', type: 'url', required: true, label: 'Purchase/Download Link', placeholder: 'https://gumroad.com/...' },

        { name: 'featuresTitle', type: 'text', required: false, label: 'Features Section Title', placeholder: 'Key Features', defaultValue: 'Key Features' },
        {
            name: 'features',
            type: 'tags',
            required: false,
            label: 'Key Features',
            placeholder: '4K Quality, Royalty Free',
            helperText: 'Separate items with commas'
        },

        { name: 'includedTitle', type: 'text', required: false, label: 'Included Section Title', placeholder: "What's Included", defaultValue: "What's Included" },
        {
            name: 'included',
            type: 'tags',
            required: false,
            label: 'Included Items',
            placeholder: 'Item 1, Item 2',
            helperText: 'Separate items with commas'
        },

        { name: 'testimonialsTitle', type: 'text', required: false, label: 'Testimonials Section Title', placeholder: 'Customer Reviews', defaultValue: 'Customer Reviews' },
        {
            name: 'testimonials',
            type: 'array',
            required: false,
            label: 'Testimonials',
            maxItems: 5,
            itemFields: [
                { name: 'text', type: 'textarea', label: 'Review', maxLength: 500 },
                { name: 'name', type: 'text', label: 'Author', maxLength: 100 }
            ]
        }
    ],

    featurefocus: [
        { name: 'name', type: 'text', required: true, label: 'Product Name', placeholder: 'TaskMaster 3.0', maxLength: 100 },
        { name: 'tagline', type: 'text', required: true, label: 'Tagline', maxLength: 100 },
        { name: 'ctaLink', type: 'url', required: false, label: 'CTA Link', placeholder: 'https://...' },
        { name: 'ctaLink', type: 'url', required: false, label: 'CTA Link', placeholder: 'https://...' },

        { name: 'featuresTitle', type: 'text', required: false, label: 'Features Section Title', placeholder: 'Features', defaultValue: 'Features' },
        {
            name: 'features',
            type: 'array',
            required: false,
            label: 'Features',
            maxItems: 6,
            itemFields: [
                { name: 'title', type: 'text', label: 'Feature', maxLength: 100 },
                { name: 'desc', type: 'textarea', label: 'Description', maxLength: 500 },
                { name: 'icon', type: 'text', label: 'Icon (emoji)', maxLength: 5 }
            ]
        },

        { name: 'comparisonTitle', type: 'text', required: false, label: 'Comparison Section Title', placeholder: 'How We Compare', defaultValue: 'How We Compare' }
    ],

    hardwareshowcase: [
        { name: 'name', type: 'text', required: true, label: 'Product Name', placeholder: 'Zenith Headphones', maxLength: 100 },
        { name: 'tagline', type: 'text', required: true, label: 'Tagline', maxLength: 100 },
        { name: 'price', type: 'text', required: false, label: 'Price', placeholder: '$299', maxLength: 20 },
        { name: 'purchaseLink', type: 'url', required: false, label: 'Buy Link', placeholder: 'https://...' },
        { name: 'specsTitle', type: 'text', required: false, label: 'Specs Section Title', placeholder: 'Tech Specs', defaultValue: 'Tech Specs' },
        {
            name: 'specs',
            type: 'array',
            required: false,
            label: 'Tech Specs',
            maxItems: 6,
            itemFields: [
                { name: 'key', type: 'text', label: 'Spec Label', maxLength: 50 },
                { name: 'value', type: 'text', label: 'Value', maxLength: 50 }
            ]
        },

        { name: 'variantsTitle', type: 'text', required: false, label: 'Variants Section Title', placeholder: 'Available Options', defaultValue: 'Available Options' },
        {
            name: 'variants',
            type: 'array',
            required: false,
            label: 'Product Variants',
            maxItems: 6,
            itemFields: [
                { name: 'name', type: 'text', label: 'Variant Name', maxLength: 50 },
                { name: 'inStock', type: 'checkbox', label: 'In Stock' }
            ]
        },
        { name: 'shippingNote', type: 'text', required: false, label: 'Shipping Note', placeholder: 'Free shipping worldwide', maxLength: 200 }
    ],

    launchpad: [
        { name: 'name', type: 'text', required: true, label: 'App/Project Name', placeholder: 'NextBigThing', maxLength: 100 },
        { name: 'headline', type: 'text', required: true, label: 'Headline', maxLength: 100 },
        { name: 'subhead', type: 'textarea', required: false, label: 'Subheadline', maxLength: 500 },
        { name: 'launchDate', type: 'date', required: false, label: 'Launch Date' },
        { name: 'launchDate', type: 'date', required: false, label: 'Launch Date' },
        { name: 'waitlistUrl', type: 'url', required: true, label: 'Waitlist/Signup URL', placeholder: 'https://...' },

        { name: 'testimonialsTitle', type: 'text', required: false, label: 'Testimonials Section Title', placeholder: 'What Early Adopters Say', defaultValue: 'What Early Adopters Say' },
        {
            name: 'testimonials',
            type: 'array',
            required: false,
            label: 'Testimonials',
            maxItems: 5,
            itemFields: [
                { name: 'quote', type: 'textarea', label: 'Quote', maxLength: 500 },
                { name: 'name', type: 'text', label: 'Author', maxLength: 100 }
            ]
        },

        { name: 'faqTitle', type: 'text', required: false, label: 'FAQ Section Title', placeholder: 'FAQ', defaultValue: 'FAQ' },
        {
            name: 'faq',
            type: 'array',
            required: false,
            label: 'FAQ',
            maxItems: 10,
            itemFields: [
                { name: 'q', type: 'text', label: 'Question', maxLength: 200 },
                { name: 'a', type: 'textarea', label: 'Answer', maxLength: 500 }
            ]
        }
    ],

    nichetool: [
        { name: 'name', type: 'text', required: true, label: 'Tool Name', placeholder: 'PDF Compressor', maxLength: 100 },
        { name: 'desc', type: 'textarea', required: true, label: 'Description', maxLength: 300 },
        { name: 'useCase', type: 'text', required: false, label: 'Primary Use Case', maxLength: 100 },
        { name: 'useCase', type: 'text', required: false, label: 'Primary Use Case', maxLength: 100 },
        { name: 'link', type: 'url', required: true, label: 'Tool URL', placeholder: 'https://...' },

        { name: 'useCasesTitle', type: 'text', required: false, label: 'Use Cases Section Title', placeholder: 'Common Use Cases', defaultValue: 'Common Use Cases' },
        {
            name: 'useCases',
            type: 'tags',
            required: false,
            label: 'Common Use Cases',
            placeholder: 'Case 1, Case 2',
            helperText: 'Separate items with commas'
        }
    ],

    opensource: [
        { name: 'name', type: 'text', required: true, label: 'Project Name', placeholder: 'React-Flow', maxLength: 100 },
        { name: 'desc', type: 'textarea', required: true, label: 'Description', maxLength: 300 },
        { name: 'repoUrl', type: 'url', required: true, label: 'Repository URL', placeholder: 'https://github.com/...' },
        { name: 'license', type: 'text', required: false, label: 'License', placeholder: 'MIT', maxLength: 20 },
        { name: 'license', type: 'text', required: false, label: 'License', placeholder: 'MIT', maxLength: 20 },

        { name: 'featuresTitle', type: 'text', required: false, label: 'Features Section Title', placeholder: 'Features', defaultValue: 'Features' },
        {
            name: 'features',
            type: 'array',
            required: false,
            label: 'Features',
            maxItems: 6,
            itemFields: [
                { name: 'title', type: 'text', label: 'Feature', maxLength: 100 },
                { name: 'desc', type: 'textarea', label: 'Description', maxLength: 500 }
            ]
        },

        { name: 'contributorsTitle', type: 'text', required: false, label: 'Contributors Section Title', placeholder: 'Contributors', defaultValue: 'Contributors' },
        {
            name: 'contributors',
            type: 'array',
            required: false,
            label: 'Top Contributors',
            maxItems: 6,
            itemFields: [
                { name: 'name', type: 'text', label: 'Name', maxLength: 50 },
                { name: 'role', type: 'text', label: 'Role', maxLength: 50 }
            ]
        }
    ],

    // Note: Product and Business themes would follow the same pattern
    // I'll add them if needed, but this shows the complete structure
};

export const getThemeFormFields = (themeId) => {
    return THEME_FORM_FIELDS[themeId] || [];
};
