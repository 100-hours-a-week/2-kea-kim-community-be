const { v4: uuidv4 } = require('uuid');
const commentModel = require('../models/commentModel');

// 댓글 가져오기
exports.getCommentsByPostId = (req, res) => {
    const postId = req.params.postId;
    const comments = commentModel.getCommentsByPostId(postId);
    res.status(200).json(comments);
};

// 댓글 등록
exports.addComment = (req, res) => {
    const postId = req.params.postId;
    const { text } = req.body;

    if (!req.session || !req.session.user) {
        console.log('Unauthorized access attempt. Session:', req.session);
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const newComment = {
        id: uuidv4(),
        postId,
        userId: req.session.user.id,
        text,
        createdAt: new Date().toISOString(),
    };

    const createdComment = commentModel.addComment(newComment);
    res.status(201).json(createdComment);
};

// 댓글 삭제
exports.deleteComment = (req, res) => {
    const commentId = req.params.id;

    if (!req.session || !req.session.user) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const comment = commentModel.getCommentById(commentId);

    // 댓글 존재 여부 확인
    if (!comment) {
        return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    if (comment.userId !== req.session.user.id) {
        return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    commentModel.deleteComment(commentId);
    res.status(200).json({ message: '댓글이 삭제되었습니다.' });
};

// 댓글 수정
exports.updateComment = (req, res) => {
    const commentId = req.params.id;
    const { text } = req.body;

    if (!req.session || !req.session.user) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const comment = commentModel.getCommentById(commentId);

    if (!comment) {
        return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    if (comment.userId !== req.session.user.id) {
        return res.status(403).json({ message: '수정 권한이 없습니다.' });
    }

    const updatedComment = commentModel.updateComment(commentId, { text });
    res.status(200).json(updatedComment);
};
