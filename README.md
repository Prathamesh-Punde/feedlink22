### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Prathamesh-Punde/feedlink22.git
   cd feedlink22
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in server directory
   touch .env
   ```
   Add the following to your `.env` file:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/authdb
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the application**
   ```bash
   # From server directory
   npm start
   # or for development with auto-reload
   npm run dev
   ```

6. **Access the application**
   Open your browser and go to: `http://localhost:5000`

## 📽️ Project Demo

[![Project Demo Video](https://img.shields.io/badge/Watch-Demo-red?logo=youtube&style=for-the-badge)](https://drive.google.com/file/d/1W4ftbY9oDXhZ6lr2yi-NLKluUn0esxXr/view?usp=sharing)

