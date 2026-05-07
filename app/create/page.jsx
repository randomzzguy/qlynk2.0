'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check, Sparkles, Briefcase, User, ShoppingBag, Palette } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getThemesByCategory, getThemeById } from '@/lib/themeRegistry';
import ThemeCard from '@/components/ThemeCard';
import DynamicForm from '@/components/DynamicForm';
import QlynkBackground from '@/components/QlynkBackground';

// Map use case IDs to category IDs
const USE_CASE_TO_CATEGORY = {
  'portfolio': 'portfolios',
  'business': 'businesses',
  'freelance': 'freelancers',
  'product': 'products'
};

const USE_CASES = [
  {
    id: 'portfolio',
    name: 'Portfolio',
    icon: Palette,
    desc: 'Showcase your work and projects',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'business',
    name: 'Business',
    icon: Briefcase,
    desc: 'Professional business presence',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'freelance',
    name: 'Freelance',
    icon: User,
    desc: 'Market your services',
    color: 'from-green to-emerald-500'
  },
  {
    id: 'product',
    name: 'Product/Brand',
    icon: ShoppingBag,
    desc: 'Launch or promote a product',
    color: 'from-orange-500 to-amber'
  }
];

import { getThemeFormFields } from '@/lib/themeFormFields';

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [useCase, setUseCase] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [themeData, setThemeData] = useState({ config_version: 'v1' });
  const [showPreview, setShowPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Check if user is logged in on mount and fetch profile
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signup');
        return;
      }

      const { getCurrentProfile } = await import('@/lib/supabase');
      const profile = await getCurrentProfile();
      setUserProfile(profile);
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  // Get themes for selected category
  const category = USE_CASE_TO_CATEGORY[useCase];
  const availableThemes = category ? getThemesByCategory(category) : [];
  const selectedThemeConfig = selectedTheme ? getThemeById(selectedTheme) : null;
  const ThemeComponent = selectedThemeConfig?.component;
  const formFields = useMemo(() => selectedTheme ? getThemeFormFields(selectedTheme) : [], [selectedTheme]);

  // Populate default values when theme changes
  useEffect(() => {
    if (selectedTheme && formFields.length > 0) {
      const defaultData = { config_version: 'v1' };
      formFields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaultData[field.name] = field.defaultValue;
        }
      });
      // Preserve existing valid data if switching back/forth (optional, but good UX)
      // For now, simpler to just reset or merge. Let's merge defaults into current, but prefer current if exists?
      // Actually, if switching themes, we probably want fresh defaults for that theme's specific fields.
      // But clearing everything might be annoying.
      // Let's just set defaults for keys that don't exist yet.

      setThemeData(prev => {
        const newData = { ...prev };
        formFields.forEach(field => {
          if (field.defaultValue !== undefined && newData[field.name] === undefined) {
            newData[field.name] = field.defaultValue;
          }
        });
        return newData;
      });
    }
  }, [selectedTheme, formFields]);

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-bright-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (step === 0 && !useCase) {
      toast.error('Please select a use case');
      return;
    }
    if (step === 1 && !selectedTheme) {
      toast.error('Please select a theme');
      return;
    }
    if (step === 2) {
      // Validate required fields before moving to preview
      const formFields = getThemeFormFields(selectedTheme);
      const requiredFields = formFields.filter(f => f.required);

      for (const field of requiredFields) {
        if (!themeData[field.name] || themeData[field.name] === '') {
          toast.error(`Please fill in: ${field.label}`);
          return;
        }
      }

      setShowPreview(true);
      setStep(3); // Move to preview step
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (showPreview && step === 3) {
      setShowPreview(false);
      setStep(2); // Go back to content form
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      const { createPage } = await import('@/lib/supabase');
      const category = USE_CASE_TO_CATEGORY[useCase];

      const pageData = {
        theme: selectedTheme,
        themeCategory: category,
        themeData: formattedThemeData,
        // Map common fields to top-level columns to satisfy DB constraints
        name: formattedThemeData.name || userProfile?.username || 'My Page',
        profession: formattedThemeData.role || formattedThemeData.profession || '',
        tagline: formattedThemeData.headline || formattedThemeData.tagline || formattedThemeData.subhead || '',
        bio: formattedThemeData.bio || formattedThemeData.intro || formattedThemeData.about || '',
        email: formattedThemeData.email || userProfile?.email || '',
        cta: formattedThemeData.ctaText || formattedThemeData.buttonText || 'Contact Me',
        ctaLink: formattedThemeData.ctaLink || formattedThemeData.link || formattedThemeData.purchaseLink || formattedThemeData.waitlistUrl || formattedThemeData.calendlyUrl || formattedThemeData.repoUrl || `mailto:${formattedThemeData.email || userProfile?.email || ''}`,
      };

      const { error } = await createPage(pageData);

      if (error) throw error;

      toast.success('Page published successfully!');
      router.push(`/${userProfile.username}`);
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error.message || 'Failed to publish page');
    } finally {
      setIsPublishing(false);
    }
  };

  // Helper function to format data based on schema types
  const formatThemeData = (data, fields) => {
    if (!data) return data;
    const formatted = { ...data };

    fields.forEach(field => {
      const value = formatted[field.name];

      if (field.type === 'tags' && typeof value === 'string') {
        formatted[field.name] = value.split(',').map(s => s.trim()).filter(Boolean);
      }
      else if (field.type === 'array' && Array.isArray(value)) {
        formatted[field.name] = value.map(item => {
          const itemFormatted = { ...item };
          field.itemFields.forEach(itemField => {
            if (itemField.type === 'tags' && typeof item[itemField.name] === 'string') {
              itemFormatted[itemField.name] = item[itemField.name].split(',').map(s => s.trim()).filter(Boolean);
            }
          });
          return itemFormatted;
        });
      }
      else if (field.type === 'object' && value && field.fields) {
        // Recursively handle nested objects if needed, though current structure is flat enough
        // implementing basic object field check
        const objectFormatted = { ...value };
        field.fields.forEach(nestedField => {
          if (nestedField.type === 'tags' && typeof value[nestedField.name] === 'string') {
            objectFormatted[nestedField.name] = value[nestedField.name].split(',').map(s => s.trim()).filter(Boolean);
          }
        });
        formatted[field.name] = objectFormatted;
      }
    });

    return formatted;
  };



  // Format data for preview and publish
  const formattedThemeData = formatThemeData(themeData, formFields);


  return (
    <div className="min-h-screen relative overflow-hidden py-12 px-4">
      <QlynkBackground />
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {['Use Case', 'Theme', 'Content', 'Preview'].map((label, index) => (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-2 ${index <= step ? 'text-[#f46530]' : 'text-gray-400'
                  }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index <= step ? 'bg-[#f46530] text-white' : 'bg-gray-200'
                    }`}>
                    {index < step ? <Check size={16} /> : index + 1}
                  </div>
                  <span className="hidden sm:inline font-bold">{label}</span>
                </div>
                {index < 3 && (
                  <div className={`h-0.5 w-12 ${index < step ? 'bg-[#f46530]' : 'bg-gray-300'
                    }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 0: Use Case Selection */}
        {step === 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-black mb-4">What are you building?</h1>
              <p className="text-gray-600 text-lg">Choose the category that best fits your needs</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {USE_CASES.map((uc) => {
                const Icon = uc.icon;
                return (
                  <div
                    key={uc.id}
                    onClick={() => setUseCase(uc.id)}
                    className={`p-8 rounded-2xl border-2 cursor-pointer transition-all ${useCase === uc.id
                      ? 'border-[#f46530] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${uc.color} flex items-center justify-center mb-4`}>
                      <Icon size={32} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">{uc.name}</h3>
                    <p className="text-gray-600">{uc.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Theme Selection */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-black mb-4">Choose Your Theme</h1>
              <p className="text-gray-600 text-lg">
                {availableThemes.length} unique themes for {USE_CASES.find(uc => uc.id === useCase)?.name.toLowerCase()}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {availableThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  selected={selectedTheme === theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Content Form */}
        {step === 2 && selectedThemeConfig && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-black mb-4">Fill in Your Content</h1>
              <p className="text-gray-600 text-lg">
                Theme: <span className="font-bold text-[#f46530]">{selectedThemeConfig.name}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Fields marked with * are required. Others are optional and can be filled later.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <DynamicForm
                fields={formFields}
                data={themeData}
                onChange={setThemeData}
              />
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && showPreview && ThemeComponent && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-black mb-4">Preview Your Page</h1>
              <p className="text-gray-600 text-lg">This is how your page will look</p>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <ThemeComponent data={formattedThemeData} />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-12">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          )}

          <div className="ml-auto">
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-4 rounded-lg font-bold bg-[#f46530] text-white hover:bg-orange-600 transition-colors"
              >
                {step === 2 ? 'Preview' : 'Next'}
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-2 px-12 py-4 rounded-lg font-bold bg-[#f46530] text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Publish Page
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {step === 3 && !showPreview && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-green-600" />
            </div>
            <h2 className="text-3xl font-black mb-4">Page Published!</h2>
            <p className="text-gray-600 mb-8">
              Your page is now live at:{' '}
              <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg font-bold">
                qlynk.site/{userProfile?.username}
              </span>
            </p>
            <a
              href={`/${userProfile?.username}`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold bg-[#f46530] text-white hover:bg-orange-600 transition-colors"
            >
              View Your Page
              <ArrowRight size={20} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}