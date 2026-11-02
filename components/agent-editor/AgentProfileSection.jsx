import { User, Briefcase, Trash2, Plus, FileText, ExternalLink, Mail, Phone, MapPin, Globe, Calendar } from 'lucide-react';

export default function AgentProfileSection({
  config,
  updateConfig,
  isPersonalAgent,
  newSkill,
  setNewSkill,
  addSkill,
  removeSkill,
  newProject,
  setNewProject,
  addProject,
  removeProject,
  updateContactInfo,
  newSocialLink,
  setNewSocialLink,
  addSocialLink,
  removeSocialLink
}) {
  return (
    <>
          {/* Bio & About */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-cyan-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-500/10 rounded flex items-center justify-center">
                <User size={18} className="text-cyan-400" />
              </div>
              {isPersonalAgent ? 'About You' : 'About This Agent'}
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
              <textarea
                value={config.bio}
                onChange={(e) => updateConfig('bio', e.target.value)}
                placeholder="Tell visitors about yourself, your background, and what you do..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all resize-none"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-green-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/10 rounded flex items-center justify-center">
                <Briefcase size={18} className="text-green-400" />
              </div>
              {isPersonalAgent ? 'Skills & Expertise' : 'Capabilities & Key Topics'}
            </h2>
            
            {/* Existing skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {config.skills.map((skill, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-sm group/skill"
                >
                  <span>{skill.name}{skill.level && ` (${skill.level})`}</span>
                  <button 
                    onClick={() => removeSkill(index)}
                    className="text-green-400/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add new skill */}
            <div className="flex gap-3">
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Skill name (e.g., React, Python)"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <input
                type="text"
                value={newSkill.level}
                onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value }))}
                placeholder="Level (optional)"
                className="w-32 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-purple-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500/10 rounded flex items-center justify-center">
                <FileText size={18} className="text-purple-400" />
              </div>
              {isPersonalAgent ? 'Projects & Work' : 'Examples & Important Information'}
            </h2>
            
            {/* Existing projects */}
            <div className="space-y-3 mb-4">
              {config.projects.map((project, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all"
                >
                  <div>
                    <h4 className="font-semibold text-white">{project.name}</h4>
                    {project.description && (
                      <p className="text-sm text-gray-400">{project.description}</p>
                    )}
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink size={10} />
                        {project.url}
                      </a>
                    )}
                  </div>
                  <button 
                    onClick={() => removeProject(index)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add new project */}
            <div className="space-y-3 p-4 bg-gray-900/30 rounded-xl border border-dashed border-gray-700/50">
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Project name"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <input
                type="text"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Short description"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <div className="flex gap-3">
                <input
                  type="url"
                  value={newProject.url}
                  onChange={(e) => setNewProject(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Project URL (optional)"
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-gray-900 transition-all text-sm"
                />
                <button
                  onClick={addProject}
                  className="px-4 py-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-amber-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500/10 rounded flex items-center justify-center">
                <Mail size={18} className="text-amber-500" />
              </div>
              Contact Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Mail size={14} className="text-amber-500/70" />
                  Email
                </label>
                <input
                  type="email"
                  value={config.contact_info.email || ''}
                  onChange={(e) => updateContactInfo('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Phone size={14} className="text-amber-500/70" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={config.contact_info.phone || ''}
                  onChange={(e) => updateContactInfo('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <MapPin size={14} className="text-amber-500/70" />
                  Location
                </label>
                <input
                  type="text"
                  value={config.contact_info.location || ''}
                  onChange={(e) => updateContactInfo('location', e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Globe size={14} className="text-amber-500/70" />
                  Website
                </label>
                <input
                  type="url"
                  value={config.contact_info.website || ''}
                  onChange={(e) => updateContactInfo('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Calendar size={14} className="text-amber-500/70" />
                  Booking Link (Calendly, Cal.com, etc.)
                </label>
                <input
                  type="url"
                  value={config.contact_info.calendly || ''}
                  onChange={(e) => updateContactInfo('calendly', e.target.value)}
                  placeholder="https://calendly.com/yourname"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-[#f46530]/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f46530]/10 rounded flex items-center justify-center">
                <Globe size={18} className="text-[#f46530]" />
              </div>
              Social Links
            </h2>
            
            {/* Existing social links */}
            <div className="space-y-2 mb-4">
              {config.social_links.map((link, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-[#f46530]/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white capitalize">{link.platform}</span>
                    <span className="text-xs text-gray-400">{link.url}</span>
                  </div>
                  <button 
                    onClick={() => removeSocialLink(index)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add new social link */}
            <div className="flex gap-3">
              <select
                value={newSocialLink.platform}
                onChange={(e) => setNewSocialLink(prev => ({ ...prev, platform: e.target.value }))}
                className="w-40 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="">Platform</option>
                <option value="twitter">Twitter/X</option>
                <option value="linkedin">LinkedIn</option>
                <option value="github">GitHub</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="dribbble">Dribbble</option>
                <option value="behance">Behance</option>
                <option value="other">Other</option>
              </select>
              <input
                type="url"
                value={newSocialLink.url}
                onChange={(e) => setNewSocialLink(prev => ({ ...prev, url: e.target.value }))}
                placeholder="Profile URL"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all text-sm"
              />
              <button
                onClick={addSocialLink}
                className="px-4 py-2.5 bg-[#f46530]/10 text-[#f46530] border border-[#f46530]/20 rounded-xl hover:bg-[#f46530]/20 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Custom Knowledge */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8 hover:border-blue-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center">
                <FileText size={18} className="text-blue-400" />
              </div>
              Custom Knowledge
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Add any additional information you want your agent to know. This could include FAQs, 
              detailed service descriptions, pricing info, or anything else visitors might ask about.
            </p>
            <textarea
              value={config.custom_knowledge}
              onChange={(e) => updateConfig('custom_knowledge', e.target.value)}
              placeholder="Enter any additional information for your agent..."
              rows={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-gray-900 transition-all resize-none"
            />
          </div>

    </>
  );
}
