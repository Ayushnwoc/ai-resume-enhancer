# AI Resume Enhancer

<div align="center">

**AI-powered web tool that tailors your existing resume to any job description while preserving structure, formatting, and authenticity.**

</div>

## ✨ Features

- **📄 File Upload**: Upload PDF resumes (max 5MB)
- **🎯 Job Description Matching**: Paste job descriptions to enhance resume alignment
- **🤖 Multiple LLM Providers**: Support for OpenAI, Anthropic (Claude), Google Gemini, and Grok (xAI)
- **📊 Matching Score**: Get a 0-100 score showing how well your resume matches the job description
- **💡 Enhancement Suggestions**: Receive AI-powered suggestions to improve your resume
- **📈 Usage History**: Track all your requests with token usage and scores
- **🔒 Privacy First**: All API keys and data stored locally in your browser
- **⚡ No Database**: All processing happens in-memory
- **🎨 Modern UI**: Beautiful, responsive interface built with Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **LLM Providers**:
  - OpenAI SDK
  - Anthropic SDK
  - Google Generative AI SDK
  - xAI (Grok) API
- **File Processing**: pdf2json for PDF parsing
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.16.0 or higher (or 22.3.0+)
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- An API key from at least one of the supported providers:
  - [OpenAI](https://platform.openai.com/api-keys)
  - [Anthropic](https://console.anthropic.com/settings/keys)
  - [Google Gemini](https://aistudio.google.com/apikey)
  - [Grok (xAI)](https://console.x.ai/api-keys)

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/Ayushnwoc/ai-resume-enhancer.git
cd ai-resume-enhancer
```

### Installation

Install the project dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build for Production

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## 📖 Usage

1. **Upload Your Resume**
   - Click the upload area or drag and drop a PDF file (max 5MB)
   - Only PDF files are currently supported

2. **Enter Job Description**
   - Paste the job description you want to match your resume against

3. **Configure API Settings**
   - Click the Settings icon (⚙️) in the header
   - Select your preferred LLM provider (OpenAI, Anthropic, Gemini, or Grok)
   - Enter your API key (stored locally in your browser)
   - Select a model from the available options
   - Click "Save Settings"

4. **Enhance Your Resume**
   - Click the "Enhance Resume" button
   - Wait for the AI to analyze and provide suggestions

5. **Review Results**
   - View your matching score (0-100)
   - Review enhancement suggestions
   - Check token usage in the History tab

## 🔑 API Keys

You need to provide your own API keys for the LLM providers. API keys are stored **only in your browser's localStorage** and are **never sent to our servers**.

### Getting API Keys

- **OpenAI**: [Get your API key](https://platform.openai.com/api-keys)
- **Anthropic (Claude)**: [Get your API key](https://console.anthropic.com/settings/keys)
- **Google Gemini**: [Get your API key](https://aistudio.google.com/apikey)
- **Grok (xAI)**: [Get your API key](https://console.x.ai/api-keys)

### Supported Models

- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, and more
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Google Gemini**: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro
- **Grok**: Grok Beta, Grok 2

## 📊 Scoring Algorithm

The matching score (0-100) is calculated using:

- **Keyword Matching (40%)**: Matches keywords from job description
- **Skill Alignment (30%)**: Compares required vs. resume skills
- **Experience Relevance (20%)**: Evaluates experience alignment
- **Overall Fit (10%)**: General alignment assessment

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Deploy (no environment variables needed)

The app is ready to deploy with zero configuration.

### Other Platforms

This is a standard Next.js application and can be deployed to:
- **Netlify**
- **Railway**
- **Render**
- **AWS Amplify**
- Any platform that supports Next.js

## 📁 Project Structure

```
ai-resume-enhancer/
├── app/
│   ├── api/
│   │   ├── enhance/      # Resume enhancement API
│   │   └── models/       # Model listing API
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page
├── components/
│   ├── elements/         # UI primitives (buttons, cards, etc.)
│   ├── HistoryModal.tsx  # History display modal
│   ├── SettingsModal.tsx # Settings configuration
│   └── ...               # Other components
├── lib/
│   ├── chunk-enhancer.ts # Main enhancement logic
│   ├── storage.ts        # LocalStorage utilities
│   └── ...               # Other utilities
└── types/
    └── index.ts          # TypeScript type definitions
```

## 🔒 Privacy & Security

- **No Data Collection**: We don't collect, store, or transmit any of your data
- **Local Storage Only**: All API keys and settings are stored in your browser's localStorage
- **No Backend Database**: All processing happens in-memory
- **Client-Side Processing**: File processing and API calls happen server-side, but no data is persisted

## ⚠️ Important Notes

- The tool **does not add fake information** - it only enhances existing content
- Original resume structure and formatting are preserved
- All processing happens server-side via API routes
- No data is persisted - everything is processed in-memory
- Maximum file size: **5MB**
- Supported formats: **PDF only**

## 🐛 Troubleshooting

### Common Issues

**Issue**: Models not loading
- **Solution**: Ensure your API key is valid and has sufficient credits/quota

**Issue**: "Failed to fetch models" error
- **Solution**: Check your API key and ensure it's correct for the selected provider

**Issue**: File upload not working
- **Solution**: Ensure the file is a PDF and under 5MB

**Issue**: Build errors
- **Solution**: Ensure you're using Node.js 20.16.0+ and run `npm install` again

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📧 Support

If you encounter any issues or have questions, please open an issue on GitHub.


