import { createClient as createClientBrowser } from '@/utils/supabase/client'

// Export the browser client for use in client components and helpers
export { createClientBrowser }

// Lightweight client-side wrappers for common Supabase operations
export const getCurrentUser = async () => {
  try {
    const supabase = createClientBrowser()
    const { data } = await supabase.auth.getUser()
    return data?.user || null
  } catch (err) {
    console.error('getCurrentUser error', err)
    return null
  }
}

export const signOut = async () => {
  try {
    const supabase = createClientBrowser()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('signOut error', err)
  }
}

export const getCurrentProfile = async () => {
  try {
    const supabase = createClientBrowser()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, onboarding_completed, onboarding_step')
      .eq('id', user.id)
      .single()

    if (error && error.code === 'PGRST116') { // No profile found
      // Try to create profile from auth metadata
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            username: user.user_metadata?.username || user.email.split('@')[0],
            email: user.email,
            onboarding_completed: false,
            onboarding_step: 'welcome'
          }
        ])
        .select()
        .single()

      if (!createError) return newProfile
    }

    return profile || null
  } catch (err) {
    console.error('getCurrentProfile error', err)
    return null
  }
}

export const getUserPage = async () => {
  try {
    const supabase = createClientBrowser()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return { data: null }

    const { data, error } = await supabase
      .from('pages')
      .select('*, social_links(*), custom_links(*)')
      .eq('user_id', user.id)
      .single()

    return { data, error }
  } catch (err) {
    console.error('getUserPage error', err)
    return { data: null, error: err }
  }
}

export const createPage = async (pageData) => {
  try {
    const supabase = createClientBrowser()

    // Ensure we have the user ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Validate theme data if theme is provided
    if (pageData.theme && pageData.themeData) {
      const { validateThemeData } = await import('@/lib/themeSchemas');
      try {
        // Validate and ensure config_version is present
        const validatedData = validateThemeData(pageData.theme, {
          config_version: 'v1',
          ...pageData.themeData
        });
        pageData.themeData = validatedData;
      } catch (validationError) {
        console.error('Theme data validation failed:', validationError);
        throw new Error(`Invalid theme data: ${validationError.message}`);
      }
    }

    // Map frontend camelCase to database snake_case
    const dbData = {
      user_id: user.id,
      name: pageData.name,
      profession: pageData.profession,
      tagline: pageData.tagline,
      bio: pageData.bio,
      profile_image: pageData.profileImage,
      email: pageData.email,
      phone: pageData.phone,
      cta_text: pageData.cta,
      cta_link: pageData.ctaLink,
      theme: pageData.theme,
      theme_category: pageData.themeCategory || 'freelancers',
      theme_data: pageData.themeData || { config_version: 'v1' },
      is_published: true
    }

    // 1. Insert main page
    const { data: pageResult, error: pageError } = await supabase
      .from('pages')
      .upsert([dbData], { onConflict: 'user_id' })
      .select()

    if (pageError) throw pageError
    const pageId = pageResult[0].id

    // 2. Insert Social Links if any
    if (pageData.socialLinks?.length > 0) {
      // First clear existing
      await supabase.from('social_links').delete().eq('page_id', pageId)

      const socialData = pageData.socialLinks.map((link, idx) => ({
        page_id: pageId,
        platform: link.platform,
        url: link.url,
        display_order: idx
      }))
      await supabase.from('social_links').insert(socialData)
    }

    // 3. Insert Custom Links if any
    if (pageData.links?.length > 0) {
      // First clear existing
      await supabase.from('custom_links').delete().eq('page_id', pageId)

      const customData = pageData.links.map((link, idx) => ({
        page_id: pageId,
        title: link.title,
        url: link.url,
        description: link.description,
        display_order: idx
      }))
      await supabase.from('custom_links').insert(customData)
    }

    return { data: pageResult[0], error: null }
  } catch (err) {
    console.error('createPage error', err)
    return { data: null, error: err }
  }
}

const supabaseService = {
  getCurrentUser,
  signOut,
  getCurrentProfile,
  getUserPage,
  createPage,
}

export default supabaseService
