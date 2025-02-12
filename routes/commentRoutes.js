const express = require('express');
const { getCommentsByPostId, addComment, deleteComment, updateComment } = require('../controllers/commentController');

const router = express.Router();

// 특정 게시글의 댓글 가져오기
router.get('/:postId/comments', getCommentsByPostId);

// 댓글 추가
router.post('/:postId/comments', addComment);

// 댓글 삭제
router.delete('/comments/:id', deleteComment);

// 댓글 수정
router.put('/comments/:id', updateComment);

module.exports = router;
