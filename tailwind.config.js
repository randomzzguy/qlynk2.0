/* eslint-disable @typescript-eslint/no-require-imports */
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
      colors: {
        // New 5-color palette
        cream: '#FFFCF2',      // Lightest - backgrounds, text on dark
        beige: '#CCC5B9',      // Light neutral - subtle backgrounds, borders
        charcoal: '#403D39',   // Medium dark - secondary text, icons
        'dark-grey': '#252422', // Darkest - primary text, main content
        orange: '#EB5E28',     // Accent - CTAs, highlights, links
        'bright-orange': '#EB5E28',
        'cyan-blue': '#0ea5e9',
        green: '#22c55e',
        amber: '#f59e0b',
        background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		animation: {
			'gentle-float': 'gentle-float 15s ease-in-out infinite',
			'gentle-float-delayed': 'gentle-float-delayed 18s ease-in-out infinite',
			'gentle-float-slow': 'gentle-float-slow 22s ease-in-out infinite',
			blob: 'blob 20s ease-in-out infinite',
			gradient: 'gradient 15s ease-in-out infinite',
			'gradient-slow': 'gradient-slow 20s ease-in-out infinite',
			first: 'first 30s ease infinite',
			second: 'second 40s ease infinite',
			third: 'third 35s ease infinite',
			fourth: 'fourth 25s ease infinite',
			fifth: 'fifth 45s ease infinite'
		},
  		keyframes: {
  			'gentle-float': {
  				'0%, 100%': {
  					transform: 'translateY(0px)',
  					filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
  				},
  				'50%': {
  					transform: 'translateY(-2px)',
  					filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12))'
  				}
  			},
  			'gentle-float-delayed': {
  				'0%, 100%': {
  					transform: 'translateY(0px)',
  					filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
  				},
  				'50%': {
  					transform: 'translateY(-2px)',
  					filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12))'
  				}
  			},
  			'gentle-float-slow': {
  				'0%, 100%': {
  					transform: 'translateY(0px)',
  					filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
  				},
  				'50%': {
  					transform: 'translateY(-2px)',
  					filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12))'
  				}
  			},
  			blob: {
  				'0%, 100%': {
  					transform: 'translate(0, 0) scale(1)'
  				},
  				'33%': {
  					transform: 'translate(30px, -50px) scale(1.1)'
  				},
  				'66%': {
  					transform: 'translate(-20px, 20px) scale(0.9)'
  				}
  			},
  			gradient: {
				'0%, 100%': {
					transform: 'scale(1) rotate(0deg)',
					opacity: '0.6'
				},
				'50%': {
					transform: 'scale(1.2) rotate(180deg)',
					opacity: '0.8'
				}
			},
			'gradient-slow': {
				'0%, 100%': {
					transform: 'scale(1) rotate(0deg)',
					opacity: '0.4'
				},
				'33%': {
					transform: 'scale(1.3) rotate(120deg)',
					opacity: '0.7'
				},
				'66%': {
					transform: 'scale(0.8) rotate(240deg)',
					opacity: '0.5'
				}
			},
			first: {
				'0%, 100%': {
					transform: 'translate(0px, 0px) rotate(0deg)'
				},
				'33%': {
					transform: 'translate(30px, -50px) rotate(120deg)'
				},
				'66%': {
					transform: 'translate(-20px, 20px) rotate(240deg)'
				}
			},
			second: {
				'0%, 100%': {
					transform: 'translate(0px, 0px) rotate(360deg)'
				},
				'33%': {
					transform: 'translate(-50px, -30px) rotate(240deg)'
				},
				'66%': {
					transform: 'translate(50px, 50px) rotate(120deg)'
				}
			},
			third: {
				'0%, 100%': {
					transform: 'translate(0px, 0px) rotate(0deg)'
				},
				'33%': {
					transform: 'translate(40px, 40px) rotate(120deg)'
				},
				'66%': {
					transform: 'translate(-40px, -40px) rotate(240deg)'
				}
			},
			fourth: {
				'0%, 100%': {
					transform: 'translate(0px, 0px) rotate(360deg)'
				},
				'33%': {
					transform: 'translate(-60px, 20px) rotate(240deg)'
				},
				'66%': {
					transform: 'translate(20px, -60px) rotate(120deg)'
				}
			},
			fifth: {
				'0%, 100%': {
					transform: 'translate(0px, 0px) rotate(0deg)'
				},
				'33%': {
					transform: 'translate(25px, -25px) rotate(120deg)'
				},
				'66%': {
					transform: 'translate(-25px, 25px) rotate(240deg)'
				}
			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
