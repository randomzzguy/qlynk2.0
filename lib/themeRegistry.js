import QuickPitch from '@/components/templates/freelancers/QuickPitch';
import SkillStack from '@/components/templates/freelancers/SkillStack';
import HireMeNow from '@/components/templates/freelancers/HireMeNow';
import StoryBuilder from '@/components/templates/freelancers/StoryBuilder';
import LocalPro from '@/components/templates/freelancers/LocalPro';
import SideHustle from '@/components/templates/freelancers/SideHustle';

import GalleryGrid from '@/components/templates/portfolios/GalleryGrid';
import CaseStudy from '@/components/templates/portfolios/CaseStudy';
import MinimalistCV from '@/components/templates/portfolios/MinimalistCV';
import MotionReel from '@/components/templates/portfolios/MotionReel';
import InteractiveDemo from '@/components/templates/portfolios/InteractiveDemo';
import NarrativeScroll from '@/components/templates/portfolios/NarrativeScroll';

import LaunchPad from '@/components/templates/products/LaunchPad';
import FeatureFocus from '@/components/templates/products/FeatureFocus';
import DigitalDownload from '@/components/templates/products/DigitalDownload';
import HardwareShowcase from '@/components/templates/products/HardwareShowcase';
import OpenSource from '@/components/templates/products/OpenSource';
import NicheTool from '@/components/templates/products/NicheTool';

import LocalBiz from '@/components/templates/businesses/LocalBiz';
import ServiceCo from '@/components/templates/businesses/ServiceCo';
import EcoBrand from '@/components/templates/businesses/EcoBrand';
import EventSpace from '@/components/templates/businesses/EventSpace';
import FranchiseHub from '@/components/templates/businesses/FranchiseHub';
import LegacyCo from '@/components/templates/businesses/LegacyCo';

/**
 * Theme Categories
 */
export const THEME_CATEGORIES = {
    freelancers: {
        id: 'freelancers',
        name: 'Freelancers',
        desc: 'Solo professionals showcasing services',
        icon: 'User'
    },
    portfolios: {
        id: 'portfolios',
        name: 'Portfolios',
        desc: 'Creatives highlighting visual work',
        icon: 'Palette'
    },
    products: {
        id: 'products',
        name: 'Products',
        desc: 'Product launches and showcases',
        icon: 'ShoppingBag'
    },
    businesses: {
        id: 'businesses',
        name: 'Businesses',
        desc: 'Professional business presence',
        icon: 'Briefcase'
    }
};

/**
 * Complete Theme Registry
 * Each theme includes: id, name, category, component, description, and required fields
 */
export const THEMES = {
    // ============================================================================
    // FREELANCER THEMES
    // ============================================================================
    quickpitch: {
        id: 'quickpitch',
        name: 'QuickPitch',
        category: 'freelancers',
        component: QuickPitch,
        description: 'Fast, minimal landing page for quick client conversion',
        bestFor: ['Consultants', 'Coaches', 'Service Providers'],
        requiredFields: ['headline', 'subhead', 'email']
    },
    skillstack: {
        id: 'skillstack',
        name: 'SkillStack',
        category: 'freelancers',
        component: SkillStack,
        description: 'Tech freelancers highlighting tools & certifications',
        bestFor: ['Developers', 'Designers', 'Tech Freelancers'],
        requiredFields: ['bio', 'email']
    },
    hiremenow: {
        id: 'hiremenow',
        name: 'HireMeNow',
        category: 'freelancers',
        component: HireMeNow,
        description: 'Urgency-focused with immediate availability',
        bestFor: ['Freelancers', 'Contractors', 'Consultants'],
        requiredFields: ['available']
    },
    storybuilder: {
        id: 'storybuilder',
        name: 'StoryBuilder',
        category: 'freelancers',
        component: StoryBuilder,
        description: 'Narrative-driven freelancers selling via personal journey',
        bestFor: ['Writers', 'Coaches', 'Creative Professionals'],
        requiredFields: ['manifesto']
    },
    localpro: {
        id: 'localpro',
        name: 'LocalPro',
        category: 'freelancers',
        component: LocalPro,
        description: 'Service-area-based freelancers targeting local clients',
        bestFor: ['Local Services', 'Contractors', 'Home Services'],
        requiredFields: ['serviceArea', 'phone', 'email']
    },
    sidehustle: {
        id: 'sidehustle',
        name: 'SideHustle',
        category: 'freelancers',
        component: SideHustle,
        description: 'Part-time/moonlighting with casual, approachable vibe',
        bestFor: ['Side Projects', 'Part-time Work', 'Passion Projects'],
        requiredFields: ['intro', 'email']
    },

    // ============================================================================
    // PORTFOLIO THEMES
    // ============================================================================
    gallerygrid: {
        id: 'gallerygrid',
        name: 'GalleryGrid',
        category: 'portfolios',
        component: GalleryGrid,
        description: 'Visual-first for photographers & artists',
        bestFor: ['Photographers', 'Illustrators', 'Visual Artists'],
        requiredFields: ['intro', 'email']
    },
    casestudy: {
        id: 'casestudy',
        name: 'CaseStudy',
        category: 'portfolios',
        component: CaseStudy,
        description: 'Designers/developers highlighting process + impact',
        bestFor: ['UX Designers', 'Product Designers', 'Developers'],
        requiredFields: ['intro', 'email']
    },
    minimalistcv: {
        id: 'minimalistcv',
        name: 'MinimalistCV',
        category: 'portfolios',
        component: MinimalistCV,
        description: 'Elegant CV with Swiss design principles',
        bestFor: ['Designers', 'Developers', 'Professionals'],
        requiredFields: ['name', 'role', 'headline', 'email']
    },
    motionreel: {
        id: 'motionreel',
        name: 'MotionReel',
        category: 'portfolios',
        component: MotionReel,
        description: 'Video editors, animators, motion designers',
        bestFor: ['Video Editors', 'Animators', 'Motion Designers'],
        requiredFields: ['email']
    },
    interactivedemo: {
        id: 'interactivedemo',
        name: 'InteractiveDemo',
        category: 'portfolios',
        component: InteractiveDemo,
        description: 'Frontend devs, creative coders, WebGL artists',
        bestFor: ['Frontend Developers', 'Creative Coders', 'WebGL Artists'],
        requiredFields: ['githubUrl']
    },
    narrativescroll: {
        id: 'narrativescroll',
        name: 'NarrativeScroll',
        category: 'portfolios',
        component: NarrativeScroll,
        description: 'Long-form storytelling with parallax effects',
        bestFor: ['Multidisciplinary Creatives', 'Storytellers', 'Artists'],
        requiredFields: ['epilogue']
    },

    // ============================================================================
    // PRODUCT THEMES
    // ============================================================================
    launchpad: {
        id: 'launchpad',
        name: 'LaunchPad',
        category: 'products',
        component: LaunchPad,
        description: 'Pre-launch/crowdfunding to build hype',
        bestFor: ['Product Launches', 'Startups', 'Crowdfunding'],
        requiredFields: ['productName', 'tagline']
    },
    featurefocus: {
        id: 'featurefocus',
        name: 'FeatureFocus',
        category: 'products',
        component: FeatureFocus,
        description: 'SaaS products with 3-5 core features',
        bestFor: ['SaaS Products', 'Apps', 'Tools'],
        requiredFields: ['productName', 'tagline']
    },
    digitaldownload: {
        id: 'digitaldownload',
        name: 'DigitalDownload',
        category: 'products',
        component: DigitalDownload,
        description: 'E-books, templates, presets - instant delivery',
        bestFor: ['Digital Products', 'Templates', 'E-books'],
        requiredFields: ['productName', 'price']
    },
    hardwareshowcase: {
        id: 'hardwareshowcase',
        name: 'HardwareShowcase',
        category: 'products',
        component: HardwareShowcase,
        description: 'Physical products - gadgets, fashion, home goods',
        bestFor: ['Physical Products', 'Gadgets', 'Fashion'],
        requiredFields: ['productName', 'price']
    },
    opensource: {
        id: 'opensource',
        name: 'OpenSource',
        category: 'products',
        component: OpenSource,
        description: 'Developer tools, libraries, frameworks',
        bestFor: ['Open Source Projects', 'Libraries', 'Frameworks'],
        requiredFields: ['projectName', 'tagline', 'githubUrl']
    },
    nichetool: {
        id: 'nichetool',
        name: 'NicheTool',
        category: 'products',
        component: NicheTool,
        description: 'Micro-SaaS solving one problem well',
        bestFor: ['Micro-SaaS', 'Utilities', 'Simple Tools'],
        requiredFields: ['toolName', 'tagline']
    },

    // ============================================================================
    // BUSINESS THEMES
    // ============================================================================
    localbiz: {
        id: 'localbiz',
        name: 'LocalBiz',
        category: 'businesses',
        component: LocalBiz,
        description: 'Brick-and-mortar - restaurants, salons, gyms',
        bestFor: ['Restaurants', 'Salons', 'Local Businesses'],
        requiredFields: ['businessName', 'address', 'phone']
    },
    serviceco: {
        id: 'serviceco',
        name: 'ServiceCo',
        category: 'businesses',
        component: ServiceCo,
        description: 'B2B service providers - consulting, agencies',
        bestFor: ['Consulting Firms', 'Agencies', 'B2B Services'],
        requiredFields: ['companyName', 'tagline']
    },
    ecobrand: {
        id: 'ecobrand',
        name: 'EcoBrand',
        category: 'businesses',
        component: EcoBrand,
        description: 'Mission-driven brands - sustainability, social impact',
        bestFor: ['Sustainable Brands', 'Social Enterprises', 'Eco Products'],
        requiredFields: ['brandName', 'mission']
    },
    eventspace: {
        id: 'eventspace',
        name: 'EventSpace',
        category: 'businesses',
        component: EventSpace,
        description: 'Venues for hire - event spaces, studios',
        bestFor: ['Event Venues', 'Studios', 'Meeting Spaces'],
        requiredFields: ['venueName', 'capacity']
    },
    franchisehub: {
        id: 'franchisehub',
        name: 'FranchiseHub',
        category: 'businesses',
        component: FranchiseHub,
        description: 'Multi-location businesses - franchises, chains',
        bestFor: ['Franchises', 'Chains', 'Multi-location Businesses'],
        requiredFields: ['brandName', 'tagline']
    },
    legacyco: {
        id: 'legacyco',
        name: 'LegacyCo',
        category: 'businesses',
        component: LegacyCo,
        description: 'Established businesses emphasizing heritage',
        bestFor: ['Heritage Brands', 'Established Businesses', 'Family Businesses'],
        requiredFields: ['companyName', 'founded', 'tagline']
    }
};

/**
 * Helper Functions
 */
export const getThemesByCategory = (category) => {
    return Object.values(THEMES).filter(theme => theme.category === category);
};

export const getThemeById = (id) => {
    return THEMES[id];
};

export const getCategoryById = (id) => {
    return THEME_CATEGORIES[id];
};

export const getAllThemes = () => {
    return Object.values(THEMES);
};

export const getAllCategories = () => {
    return Object.values(THEME_CATEGORIES);
};
