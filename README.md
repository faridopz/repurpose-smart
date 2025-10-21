# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/d6b57bf3-6a21-495f-a6df-c6f3c5aa4fb8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d6b57bf3-6a21-495f-a6df-c6f3c5aa4fb8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d6b57bf3-6a21-495f-a6df-c6f3c5aa4fb8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## WebinarAI - Project Overview

WebinarAI is a full-stack platform that transforms webinar recordings into actionable content using AI.

### Features
- **Authentication**: Secure email/password signup and login
- **Webinar Upload**: Support for MP4/MP3 files via cloud storage
- **AI Transcription**: Automatic transcription with AssemblyAI integration
- **AI Content Generation**: Create blogs, social posts, and summaries using OpenAI GPT-4
- **Analytics Dashboard**: Track content performance and engagement
- **Dark Theme**: Modern black (#0B0B0D) and orange (#FF7A00) design

### Architecture
- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL with Row Level Security
- **Storage**: Secure file storage with Supabase Storage
- **AI Services**: AssemblyAI (transcription) + OpenAI GPT-4 (generation)

### Database Schema
- `profiles`: User settings and preferences
- `webinars`: Uploaded files and metadata
- `transcripts`: Transcription data with timestamps
- `ai_content`: Generated blogs, posts, and summaries

### Deployment
This project is deployed on Lovable and uses Lovable Cloud for backend services. All environment variables and API keys are securely managed through the Lovable Cloud integration.

To deploy updates:
1. Make changes in Lovable editor
2. Click "Publish" in the top right
3. Your app is live at your custom domain or Lovable subdomain
