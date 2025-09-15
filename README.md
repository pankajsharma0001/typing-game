# ⌨️ Typing Game Web App

A full-stack typing game built with **Next.js, MongoDB, and NextAuth**.  
Users can sign up, play typing tests (timed or unlimited), and view stats like WPM and accuracy.  
Includes password reset via email (Nodemailer + Gmail).

---

## 🚀 Features
- 🔑 Authentication with **NextAuth**
- 📊 Stores game results in **MongoDB**
- ⏱️ Timed & unlimited typing modes
- 📈 Tracks WPM & accuracy in real time
- 🔐 Password reset with email verification
- ☁️ Fully deployable on **Vercel**

---

## 🛠️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/typing-game.git
cd typing-game
```
### 2. Add environment variables
  Create .env.local and put the following code
```bash
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/typinggame

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email (Nodemailer + Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

#Google (To send reset mail)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```
1. MONGODB_URI  
   install [MongoDB](https://www.mongodb.com/try/download/community) and use:
     ```bash
     mongodb://127.0.0.1:27017/typinggame
     ```
2. NextAuth  

    NEXTAUTH_SECRET → Generate a strong random string (for example run openssl rand -base64 32 in your terminal).  
    NEXTAUTH_URL → http://localhost:3000 (by default)  

3. Email (Nodemailer + Gmail)  
    EMAIL_USER → Your Gmail address.  
    EMAIL_PASS → An App Password (⚠️ not your Gmail password).  
      -Go to [Google Account Security](https://myaccount.google.com/security)  
      -Enable 2-Step Verification.  
      -Generate an App Password and use it here.  

4. Google OAuth  
     -Go to [Google Cloud Console](https://console.cloud.google.com/).  
     -Create a new project.  
     -Navigate to APIs & Services → Credentials → Create Credentials → OAuth Client ID.  
     -Choose Web Application.  
     -Add Authorized Redirect URIs:  
       ```bash
         http://localhost:3000/api/auth/callback/google
        ```
     -Copy the Client ID → GOOGLE_CLIENT_ID.  
     -Copy the Client Secret → GOOGLE_CLIENT_SECRET.  
   
### 3. Install dependencies  
  ```bash
    npm install next react react-dom next-auth axios mongoose mongodb nodemailer lucide-react recharts
    npm install -D eslint prettier
   ```

## 📝 License  
MIT License. Free to use and modify.
