const fs = require('fs');
const path = require('path');

const commentsFilePath = path.join(__dirname, '../data/comments.json');

// JSON 파일에서 댓글 데이터를 읽기
const readComments = () => {
    try {
        const data = fs.readFileSync(commentsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading comments file:', error);
        return [];
    }
};

// 댓글 데이터를 JSON 파일에 저장
const writeComments = (comments) => {
    try {
        fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));
    } catch (error) {
        console.error('Error writing comments file:', error);
    }
};

// 특정 사용자의 모든 댓글 삭제
function deleteCommentsByUser(userId) {
    let comments = readComments();
    const filteredComments = comments.filter(comment => comment.userId !== userId);

    if (comments.length === filteredComments.length) {
        return false;
    }

    writeComments(filteredComments);
    return true;
}

// 댓글 데이터 CRUD
module.exports = {
    getCommentsByPostId: (postId) => {
        const comments = readComments();
        return comments.filter(comment => comment.postId === postId);
    },
    addComment: (newComment) => {
        const comments = readComments();
        comments.push(newComment);
        writeComments(comments);
        return newComment;
    },
    deleteComment: (commentId) => {
        const comments = readComments();
        const updatedComments = comments.filter(comment => comment.id !== commentId);
        writeComments(updatedComments);
    },
    getCommentById: (commentId) => {
        const comments = readComments();
        return comments.find(comment => comment.id === commentId);
    },
    updateComment: (commentId, updatedFields) => {
        const comments = readComments();
        const commentIndex = comments.findIndex(comment => comment.id === commentId);
        if (commentIndex !== -1) {
            comments[commentIndex] = { ...comments[commentIndex], ...updatedFields };
            writeComments(comments);
            return comments[commentIndex];
        }
        return null;
    },
    deleteCommentsByUser,
};