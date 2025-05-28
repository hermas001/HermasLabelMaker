module.exports = {
  content: [
    "./public/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(220, 30%, 97%)',
        foreground: 'hsl(220, 25%, 25%)',
        card: 'hsl(0, 0%, 100%)',
        'card-foreground': 'hsl(220, 25%, 25%)',
        popover: 'hsl(0, 0%, 100%)',
        'popover-foreground': 'hsl(220, 25%, 25%)',
        primary: {
          DEFAULT: 'hsl(189, 99%, 31%)', // #01889F
          foreground: 'hsl(0, 0%, 100%)'
        },
        secondary: {
          DEFAULT: 'hsl(189, 80%, 92%)',
          foreground: 'hsl(189, 90%, 25%)'
        },
        muted: {
          DEFAULT: 'hsl(220, 15%, 80%)',
          foreground: 'hsl(220, 15%, 50%)'
        },
        accent: {
          DEFAULT: 'hsl(189, 90%, 40%)',
          foreground: 'hsl(0, 0%, 100%)'
        },
        destructive: {
          DEFAULT: 'hsl(30, 85%, 50%)',
          foreground: 'hsl(0, 0%, 100%)'
        },
        border: 'hsl(220, 20%, 88%)',
        input: 'hsl(0, 0%, 100%)',
        ring: 'hsl(189, 90%, 75%)',
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)'
      },
      fontFamily: {
        sans: ['Poppins', 'Noto Sans Malayalam', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
