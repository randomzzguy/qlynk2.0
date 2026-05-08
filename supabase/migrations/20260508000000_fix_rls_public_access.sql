-- Enable public read access for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

-- Enable public read access for pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public pages are viewable by everyone" 
ON public.pages FOR SELECT USING (true);

-- Enable public read access for social links
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public social links are viewable by everyone" 
ON public.social_links FOR SELECT USING (true);

-- Enable public read access for custom links
ALTER TABLE public.custom_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public custom links are viewable by everyone" 
ON public.custom_links FOR SELECT USING (true);

-- Enable public read access for agent configs
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public agent configs are viewable by everyone" 
ON public.agent_configs FOR SELECT USING (true);
