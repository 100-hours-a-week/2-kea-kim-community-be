const fs = require('fs');
const path = require('path');

const POSTS_FILE = path.join(__dirname, '../data/posts.json');

// 현재 저장된 게시글 중 가장 높은 ID를 찾아 초기화
function getLastPostId() {
    if (!fs.existsSync(POSTS_FILE)) {
        fs.writeFileSync(POSTS_FILE, JSON.stringify([]), "utf8");
        return 0;
    }

    const data = fs.readFileSync(POSTS_FILE, "utf8");
    const posts = data ? JSON.parse(data) : [];

    if (posts.length === 0) return 0;

    return Math.max(...posts.map(post => post.id));
}

let lastPostId = getLastPostId();

// 모든 게시글 가져오기 (최신순)
function getPosts() {
    if (!fs.existsSync(POSTS_FILE)) {
        fs.writeFileSync(POSTS_FILE, JSON.stringify([]), 'utf8');
    }
    const data = fs.readFileSync(POSTS_FILE, 'utf8');
    const posts = data ? JSON.parse(data) : [];

    // 최신순 정렬
    return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// 새로운 게시글 생성
function createPost({ title, content, image, userId }) {
    const posts = getPosts();

    lastPostId = getLastPostId() + 1;

    const newPost = {
        id: lastPostId,
        title,
        content,
        image: image || null,
        userId,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        views: 0,
        likedUsers: [] // 좋아요 누른 사용자 저장

    };

    posts.push(newPost);

    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');

    return newPost;
}

// 게시글 수정
function updatePost(id, updatedFields) {
    const posts = getPosts();
    const postIndex = posts.findIndex(post => post.id === id);

    if (postIndex === -1) {
        return null;
    }

    posts[postIndex] = {
        ...posts[postIndex],
        ...updatedFields,
        updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');

    return posts[postIndex];
}

// 특정 게시글 가져오기 (ID로)
function findPostById(id) {
    const posts = getPosts();
    return posts.find(post => post.id === id);
}

// 게시글 삭제
function deletePost(id) {
    const posts = getPosts();
    const postIndex = posts.findIndex(post => post.id === id);

    if (postIndex === -1) {
        return false;
    }

    posts.splice(postIndex, 1);

    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
    return true;
}

// 특정 사용자의 게시글 삭제
function deletePostsByUser(userId) {
    let posts = getPosts();
    const filteredPosts = posts.filter(post => post.userId !== userId);

    if (posts.length === filteredPosts.length) {
        return false;
    }

    fs.writeFileSync(POSTS_FILE, JSON.stringify(filteredPosts, null, 2), "utf8");
    return true;
}

module.exports = {
    getPosts,
    createPost,
    updatePost,
    findPostById,
    deletePost,
    deletePostsByUser
};
