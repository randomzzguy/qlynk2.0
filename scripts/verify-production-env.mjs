process.env.NODE_ENV = 'production';

const { validateEnvironmentVariables } = await import('../lib/env-validation.js');
const validation = validateEnvironmentVariables();

if (!validation.isValid) {
  console.error('Production environment validation failed:');
  validation.errors.forEach((error) => console.error(`- ${error.replace(/^❌\s*/, '')}`));
  process.exitCode = 1;
} else {
  console.log(`Production environment validation passed (${validation.summary.configuredRequired}/${validation.summary.totalRequired} required variables configured).`);
}

validation.warnings.forEach((warning) => console.warn(`- ${warning.replace(/^⚠️\s*/, '')}`));
