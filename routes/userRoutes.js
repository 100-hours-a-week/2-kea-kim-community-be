const express = require('express');
const { registerUser, loginUser, getProfile, logoutUser, getUserByIdHandler, updateProfile, updatePassword, deleteAccount } = require('../controllers/userController');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// 파일 업로드 설정
// const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// 파일 업로드 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// 회원가입 라우트
router.post('/register', upload.single('profilePic'), registerUser);

// 로그인 라우트
router.post('/login', loginUser);

// 사용자 프로필 라우트
router.get('/profile', getProfile);

// 로그아웃 라우트
router.post('/logout', logoutUser);

// 사용자 정보 조회
router.get('/:id', getUserByIdHandler);

// 사용자 정보 수정
router.put('/profile/update', upload.single('profilePic'), updateProfile);

// 비밀번호 변경
router.put('/profile/password', updatePassword);

// 회원 탈퇴 라우트
router.delete("/profile/delete", deleteAccount);

module.exports = router;
