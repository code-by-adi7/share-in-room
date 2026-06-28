# RoomShare 

## What is RoomShare?

RoomShare is a modern, real-time file sharing application designed to make temporary file exchanges simple, secure, and collaborative. Instead of sending files through messy email attachments or dealing with complex cloud storage permissions, RoomShare allows you to create temporary, password-protected "Rooms". 

Users can join these rooms to instantly view, upload, and download files in real-time. It's the perfect solution for quick team collaborations, sharing assets with clients, or distributing documents to a group.

---

## How to Use RoomShare

### 1. Creating a Room
- Navigate to the **Dashboard** and click on **Create Room**.
- Provide a unique **Room Name** and a secure **Password**.
- Once created, you become the "Owner" of that room and can share the room name and password with anyone you want to invite.

### 2. Joining a Room
- From the Dashboard, click **Join Room**.
- Enter the exact **Room Name** and the **Password** provided by the owner.
- You will instantly enter the room and see all files currently shared within it.

### 3. Uploading & Downloading Files
- **Uploading**: Simply drag and drop files into the designated dropzone, or click the upload button to browse your device. Files are uploaded instantly and appear for all users currently in the room.
- **Downloading**: Click the download icon next to any file in the list to save it to your device.

### 4. Room Management (For Owners)
As the room creator, you have administrative privileges:
- **Visitor Management**: See who is currently in the room, revoke specific users' upload permissions, or kick them from the room entirely.
- **File Management**: You can delete any file uploaded to your room, regardless of who uploaded it.
- **Room Settings**: You can toggle global uploads off to lock the room, or permanently delete the room when the collaboration is finished.

---

## Executing Locally

To run this project on your local machine, follow these steps:

### Prerequisites
- Node.js 18.x or later installed.
- A Supabase project set up for database and storage.

### Installation
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd roomshare
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## Tech Stack

RoomShare is built using modern, high-performance web technologies:

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with a custom Neo-brutalist / Skeuomorphic UI design system.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth scroll reveals and micro-interactions.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend as a Service (BaaS)**: [Supabase](https://supabase.com/) 
  - **Database**: PostgreSQL with Row-Level Security (RLS) for robust access control.
  - **Storage**: Supabase Storage buckets for secure file hosting.
  - **Authentication**: Supabase Auth for user identity management.
  - **Realtime**: Supabase Realtime subscriptions to track active room presence.
