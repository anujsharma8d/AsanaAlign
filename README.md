# 🧘‍♂️ AsanaAlign

AsanaAlign is a web-based yoga posture alignment application that helps users practice yoga with real-time pose detection. It uses the webcam to detect body posture and provides an interactive experience for improving yoga form and alignment.

## 🚀 Features

- 🧘 Real-time yoga pose detection
- 📷 Webcam-based posture tracking
- 🤖 TensorFlow.js powered pose estimation
- ⚛️ React + Vite frontend
- 🌐 Node.js + Express backend
- 🗄️ MongoDB database integration
- 🔐 User authentication support
- 📱 Clean and responsive UI

## 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- React Router DOM
- TensorFlow.js
- TensorFlow Pose Detection
- React Webcam
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB
- bcryptjs
- dotenv
- CORS

## 📁 Project Structure

```bash
AsanaAlign/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── render.yaml
├── .gitignore
└── README.md
````

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/anujsharma8d/AsanaAlign.git
cd AsanaAlign
```

## 🔧 Backend Setup

Go to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `backend` folder:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend server:

```bash
npm run dev
```

If `npm run dev` does not work, run:

```bash
npm start
```

The backend server will run on:

```bash
http://localhost:3000
```

## 🎨 Frontend Setup

Open a new terminal and go to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `frontend` folder:

```env
VITE_API_URL=http://localhost:3000
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will usually run on:

```bash
http://localhost:5173
```

## ⚠️ Important Note

If both frontend and backend are running on the same port, change the frontend port to `5173`.

In `frontend/package.json`, you can use:

```json
"scripts": {
  "dev": "vite --port 5173",
  "start": "vite --port 5173",
  "build": "vite build",
  "preview": "vite preview"
}
```

## 🔐 Environment Variables

### Backend `.env`

| Variable      | Description                   |
| ------------- | ----------------------------- |
| `PORT`        | Backend server port           |
| `NODE_ENV`    | Application environment       |
| `MONGODB_URI` | MongoDB connection string     |
| `JWT_SECRET`  | Secret key for authentication |

### Frontend `.env`

| Variable       | Description     |
| -------------- | --------------- |
| `VITE_API_URL` | Backend API URL |

## 📦 Available Scripts

### Backend

Run the backend server:

```bash
npm start
```

Run the backend server in development mode:

```bash
npm run dev
```

### Frontend

Run the frontend development server:

```bash
npm run dev
```

Build the frontend for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 📸 How It Works

1. The user opens the web application.
2. The app asks for webcam access.
3. TensorFlow.js detects body keypoints.
4. The app analyzes the yoga posture.
5. The user gets visual feedback to improve posture alignment.

## 🌍 Deployment

This project includes a `render.yaml` file for deployment.

### Backend Deployment

Use the following settings:

```bash
Root Directory: backend
Build Command: npm install
Start Command: node server.js
```

Add the required environment variables in your deployment platform:

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Frontend Deployment

Use the following settings:

```bash
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

Add the frontend environment variable:

```env
VITE_API_URL=your_backend_deployed_url
```

## 🧠 Future Improvements

* Add more yoga asanas
* Improve posture accuracy
* Add AI-based pose correction suggestions
* Add mobile-friendly improvements
* Add voice-based posture guidance
* Add personalized yoga plans

## 🤝 Contributing

Contributions are welcome.

To contribute:

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature-name
```

3. Make your changes
4. Commit your changes

```bash
git commit -m "Add feature-name"
```

5. Push to your branch

```bash
git push origin feature-name
```

6. Create a Pull Request

## 📄 License

This project is open-source. You can add a license file to define usage permissions clearly.

## 👨‍💻 Author

**Anuj Sharma**

* GitHub: anujsharma8d

## ⭐ Support

If you like this project, consider giving it a star ⭐ on GitHub.

```
```
