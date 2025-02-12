const express = require('express');
const multer = require('multer');
const { 
    createPostHandler, getAllPostsHandler, getPostByIdHandler, updatePostHandler, deletePostHandler, likePostHandler, unlikePostHandler
} = require('../controllers/postController');

const router = express.Router();

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

// 모든 게시글 조회
router.get('/posts', getAllPostsHandler);

// 특정 게시글 조회 (ID로)
router.get('/posts/:id', getPostByIdHandler);

// 게시글 작성
router.post('/posts', upload.single('image'), createPostHandler);

// 특정 게시글 수정
router.put('/posts/:id', upload.single('image'), updatePostHandler);

// 특정 게시글 삭제
router.delete('/posts/:id', deletePostHandler);

// 좋아요 추가
router.post('/posts/:id/like', likePostHandler);

// 좋아요 취소
router.delete('/posts/:id/like', unlikePostHandler);

module.exports = router;
