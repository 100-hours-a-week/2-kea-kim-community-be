const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
const PORT = 4000;

// CORS 설정
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));


// 세션 설정
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false, // 초기화되지 않은 세션은 저장하지 않음
    cookie: {
        secure: false, // HTTPS가 아니라면 false로 설정
        httpOnly: true, // JavaScript에서 쿠키 접근 불가
        sameSite: 'lax', // Cross-site 쿠키 전송 허용
        maxAge: 1000 * 60 * 30  // 30분 세션 유지
    }
}));


// 미들웨어
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    if (req.session && req.session.user) {
        console.log('User Session Active:', req.session.user);
    } else {
        console.log('No active user session.');
    }
    next();
});

// 라우트
app.use('/api/users', userRoutes);
app.use('/api', postRoutes); 
app.use('/api/posts', commentRoutes);


// 서버 시작
app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
});
