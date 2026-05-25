# Production Deployment Steps

## 🚀 **Quick Deployment Guide**

Your current project is 100% ready for production deployment on the free tier.

---

## **Step 1: Prepare Environment Variables**

Create `.env.production` file:

```bash
# Copy your current .env.local values
cp .env.local .env.production

# Edit .env.production with these production settings:
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your-current-project-url
SUPABASE_SERVICE_ROLE_KEY=your-current-service-key
SUPABASE_ANON_KEY=your-current-anon-key
GROQ_API_KEY=your-groq-key
STRIPE_SECRET_KEY=sk_test_your-stripe-key  # Keep test keys for now
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-hcaptcha-key
HCAPTCHA_SECRET_KEY=your-hcaptcha-secret-key
```

---

## **Step 2: Choose Hosting Platform**

### **Option A: Vercel (Recommended - Free)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Follow prompts to connect your repo
```

### **Option B: Netlify (Free)**
```bash
# Build and deploy
npm run build
# Upload .next folder to Netlify
```

### **Option C: Railway (Free Tier)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

---

## **Step 3: Deploy Application**

### **Using Vercel (Easiest)**
1. Push your code to GitHub/GitLab
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Vercel will auto-detect Next.js
6. Add environment variables in Vercel dashboard
7. Click "Deploy"

### **Manual Deployment**
```bash
# Build for production
npm run build

# Start production server (for testing)
npm start

# Deploy .next folder to your hosting platform
```

---

## **Step 4: Configure Domain (Optional)**

### **Free Domain (Vercel)**
- Vercel provides: `your-project.vercel.app`
- No configuration needed

### **Custom Domain**
1. Buy domain from Namecheap, GoDaddy, etc.
2. Add domain in hosting platform
3. Update DNS records
4. Wait for propagation (1-24 hours)

---

## **Step 5: Post-Deployment Verification**

### **Test These URLs**
Replace `yourdomain.com` with your actual domain:

```bash
# Health check
https://yourdomain.com/api/health

# System status  
https://yourdomain.com/api/status

# Main application
https://yourdomain.com

# User registration
https://yourdomain.com/auth/signup

# Login
https://yourdomain.com/auth/login
```

### **Expected Responses**

**Health Check:**
```json
{
  "status": "healthy",
  "database": { "status": "healthy" },
  "environmentValidation": { "isValid": true }
}
```

**Status:**
```json
{
  "status": "operational",
  "features": {
    "urlScraping": true,
    "sentimentAnalysis": true,
    "csvExport": true
  }
}
```

---

## **Step 6: Test User Flows**

### **Critical Tests**
- [ ] User registration works
- [ ] Email confirmation received
- [ ] Login successful
- [ ] Onboarding completes
- [ ] Agent creation works
- [ ] Chat widget functions
- [ ] File uploads work
- [ ] URL scraping works
- [ ] CSV export downloads

### **Payment Testing (Test Mode)**
- [ ] Stripe checkout opens
- [ ] Test payment completes
- [ ] Webhook receives events
- [ ] Subscription updates work

---

## **Step 7: Set Up Monitoring**

### **Daily Checks**
- Visit `/api/health` - should be "healthy"
- Visit `/api/status` - should be "operational"
- Check Supabase dashboard for usage
- Monitor hosting platform metrics

### **Weekly Reviews**
- Database storage usage
- File storage usage  
- Monthly active users
- Error rates and performance

### **Alert Setup**
- Set up uptime monitoring (UptimeRobot - free)
- Monitor `/api/health` endpoint
- Alert if response time > 2s
- Alert if status != "healthy"

---

## **Step 8: Launch! 🎉**

### **Go Live Checklist**
- [ ] All tests passing
- [ ] Environment variables set
- [ ] Domain configured
- [ ] Monitoring active
- [ ] Backup plan ready
- [ ] Support contact ready

### **Launch Day Actions**
1. Deploy final version
2. Test everything one more time
3. Open registration to public
4. Monitor system closely
5. Respond to user feedback

---

## **Troubleshooting**

### **Common Issues**

**Build Fails:**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

**Environment Variables Missing:**
```bash
# Check .env.production exists
cat .env.production

# Test locally
NODE_ENV=production npm run build
```

**Database Connection Issues:**
- Check Supabase URL is correct
- Verify service role key
- Test with `/api/health` endpoint

**Stripe Webhook Issues:**
- Use Stripe CLI for testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Check webhook URL is accessible
- Verify webhook secret matches

---

## **Free Tier Optimization**

### **Stay Within Limits**
- **Database**: Archive old conversations regularly
- **Storage**: Clean up unused files
- **Bandwidth**: Optimize images and assets
- **Users**: Monitor active user count

### **Cleanup Scripts**
```sql
-- Run monthly to clean old data
DELETE FROM agent_conversations 
WHERE created_at < NOW() - INTERVAL '6 months';

DELETE FROM agent_messages 
WHERE created_at < NOW() - INTERVAL '6 months';
```

---

## **You're Ready! 🚀**

Your Qlynk application is production-ready on the free tier. The deployment is straightforward since everything is already configured.

**Time to go live:**
1. Choose hosting platform (Vercel recommended)
2. Deploy with environment variables
3. Test all functionality
4. Start acquiring users!

*Free tier can handle thousands of users - you're all set for success!* 🎯
