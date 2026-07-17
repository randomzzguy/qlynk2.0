export const DEFAULT_AGENT_TYPE = 'personal';

export const AGENT_TYPE_CATALOG = [
  {
    id: 'personal',
    label: 'Personal AI',
    shortLabel: 'Personal',
    description: 'Represents a person, their work, experience, projects, and expertise.',
    defaultPurpose: 'Help visitors understand this person, their work, and the knowledge they have chosen to share.',
  },
  {
    id: 'business',
    label: 'Business or Service',
    shortLabel: 'Business',
    description: 'Explains a company, professional service, offering, process, and next steps.',
    defaultPurpose: 'Help visitors understand this business, its services, policies, and appropriate next steps.',
  },
  {
    id: 'property',
    label: 'Property or Place Guide',
    shortLabel: 'Property',
    description: 'Guides guests or workers around a property, venue, facility, or destination.',
    defaultPurpose: 'Provide accurate guidance about this place, including locations, procedures, equipment, and approved local information.',
  },
  {
    id: 'operations',
    label: 'Operations and Training Guide',
    shortLabel: 'Operations',
    description: 'Answers questions about onboarding, responsibilities, checklists, equipment, and SOPs.',
    defaultPurpose: 'Help authorized people follow approved procedures, complete routine tasks, and escalate anything uncertain or unsafe.',
  },
  {
    id: 'product',
    label: 'Product Guide',
    shortLabel: 'Product',
    description: 'Explains a product, its features, setup, usage, limitations, and support options.',
    defaultPurpose: 'Help people understand and use this product based only on approved product information.',
  },
  {
    id: 'support',
    label: 'Customer Support',
    shortLabel: 'Support',
    description: 'Handles approved FAQs and troubleshooting before escalating to a human.',
    defaultPurpose: 'Resolve supported questions using approved instructions and escalate when the answer is missing, sensitive, or requires human judgment.',
  },
  {
    id: 'custom',
    label: 'Custom Guide',
    shortLabel: 'Custom',
    description: 'Uses a custom purpose while retaining Qlynk safety, scope, and cost protections.',
    defaultPurpose: 'Answer questions within the purpose and boundaries configured by the agent owner.',
  },
];

export const AGENT_TYPE_IDS = AGENT_TYPE_CATALOG.map((type) => type.id);

export function getAgentTypeDefinition(agentType) {
  return AGENT_TYPE_CATALOG.find((type) => type.id === agentType)
    || AGENT_TYPE_CATALOG.find((type) => type.id === DEFAULT_AGENT_TYPE);
}

export function isSupportedAgentType(agentType) {
  return AGENT_TYPE_IDS.includes(agentType);
}
