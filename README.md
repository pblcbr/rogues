# tacmind

A modern, production-ready Next.js application built with TypeScript, Tailwind CSS, and industry best practices.

## 🚀 Features

- ⚡ **Next.js 14** with App Router and React Server Components
- 🔷 **TypeScript** for full type safety
- 🎨 **Tailwind CSS** for utility-first styling
- 🧩 **Shadcn UI** components (pre-configured)
- 📦 **Zustand** for state management
- 🔄 **TanStack Query** for data fetching
- ✅ **Zod** for schema validation
- 🎯 **ESLint** and **Prettier** for code quality
- 📱 Mobile-first responsive design
- 🌙 Dark mode ready

## 📋 Project Structure

```
rogues/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── example/          # Example components
├── lib/                  # Utility functions
│   └── utils.ts         # Helper utilities
├── types/               # TypeScript type definitions
│   └── index.ts        # Global types
├── public/             # Static assets
└── .cursorrules       # Cursor AI rules
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd rogues
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🎨 Adding Shadcn UI Components

This project is configured to work with Shadcn UI. To add new components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
# ... and more
```

## 🏗️ Tech Stack

### Core

- [Next.js 14](https://nextjs.org/) - React framework
- [React 18](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety

### Styling

- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Shadcn UI](https://ui.shadcn.com/) - Component library
- [class-variance-authority](https://cva.style/) - Component variants

### State & Data

- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Zod](https://zod.dev/) - Schema validation

### Development

- [ESLint](https://eslint.org/) - Linting
- [Prettier](https://prettier.io/) - Code formatting

## 🔧 Configuration

### TypeScript

The project uses strict TypeScript configuration. See `tsconfig.json` for details.

### ESLint

ESLint is configured with Next.js recommended rules. See `.eslintrc.json`.

### Prettier

Prettier is configured with Tailwind CSS plugin. See `.prettierrc`.

### Tailwind CSS

Tailwind is configured with CSS variables for easy theming. See `tailwind.config.ts`.

## 📝 Best Practices

This project follows industry best practices:

- ✅ **Server Components by default** - Use `'use client'` only when necessary
- ✅ **Functional programming** - Avoid classes, use pure functions
- ✅ **Type safety** - Full TypeScript coverage
- ✅ **Component composition** - Small, reusable components
- ✅ **Error handling** - Early returns and guard clauses
- ✅ **Responsive design** - Mobile-first approach
- ✅ **Performance optimization** - Dynamic imports and lazy loading

## 🌐 Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
npm install -g vercel
vercel
```

### Other Platforms

This project can be deployed to any platform that supports Next.js:

- AWS Amplify
- Netlify
- Railway
- Render
- Self-hosted with Node.js

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Built with ❤️ using Next.js and TypeScript
