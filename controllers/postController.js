const { createPost, getPosts, findPostById, updatePost, deletePost } = require('../models/postModel');
const { findUserById } = require('../models/userModel');

// 게시글 작성
exports.createPostHandler = (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const { title, content } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        if (!title || !content) {
            return res.status(400).json({ message: '제목과 내용을 모두 입력해 주세요.' });
        }

        const userId = req.session.user.id; // 로그인된 사용자 ID

        // 사용자 검증
        const author = findUserById(userId);
        if (!author) {
            return res.status(404).json({ message: '작성자를 찾을 수 없습니다.' });
        }

        // 게시글 생성
        const newPost = createPost({
            title,
            content,
            image,
            userId
        });

        return res.status(201).json({ message: '게시글이 성공적으로 작성되었습니다.', post: newPost });
    } catch (error) {
        console.error('게시글 작성 오류:', error);
        return res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 모든 게시글 조회
exports.getAllPostsHandler = (req, res) => {
    try {
        const posts = getPosts();
        return res.status(200).json(posts);
    } catch (error) {
        console.error('게시글 조회 오류:', error);
        return res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 특정 게시글 조회 (ID로)
exports.getPostByIdHandler = (req, res) => {
    try {
        const postId = parseInt(req.params.id, 10);
        const post = findPostById(postId);

        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 작성자 정보 추가
        const author = findUserById(post.userId);
        if (author) {
            post.author = {
                id: author.id,
                nickname: author.nickname,
                profilePic: author.profilePic || '/images/profile_img.webp',
            };
        } else {
            post.author = {
                id: null,
                nickname: '알 수 없음',
                profilePic: '/images/profile_img.webp',
            };
        }

         // 현재 사용자가 게시글에 좋아요를 눌렀는지 확인
         post.isLiked = post.likedUsers?.includes(req.session.user?.id) || false;

        // 조회수 증가
        post.views += 1;
        updatePost(postId, { views: post.views });

        res.status(200).json(post);
    } catch (error) {
        console.error('게시글 상세 조회 오류:', error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 게시글 수정
exports.updatePostHandler = (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const postId = parseInt(req.params.id, 10);
        const { title, content } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        if (!title || !content) {
            return res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
        }

        // 게시글 존재 여부 확인
        const existingPost = findPostById(postId);
        if (!existingPost) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 작성자 확인
        if (existingPost.userId !== req.session.user.id) {
            return res.status(403).json({ message: '수정 권한이 없습니다.' });
        }

        // 게시글 수정
        const updatedFields = {
            title,
            content,
            image: image || existingPost.image, // 새 이미지 없으면 기존 이미지 유지
        };

        const updatedPost = updatePost(postId, updatedFields);
        if (!updatedPost) {
            return res.status(500).json({ message: '게시글 수정 중 오류가 발생했습니다.' });
        }

        res.status(200).json({ message: '게시글이 성공적으로 수정되었습니다.', post: updatedPost });
    } catch (error) {
        console.error('게시글 수정 오류:', error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 게시글 삭제
exports.deletePostHandler = (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const postId = parseInt(req.params.id, 10);

        // 게시글 존재 여부 확인
        const existingPost = findPostById(postId);
        if (!existingPost) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 작성자 확인
        if (existingPost.userId !== req.session.user.id) {
            return res.status(403).json({ message: '삭제 권한이 없습니다.' });
        }

        // 게시글 삭제
        const isDeleted = deletePost(postId);
        if (!isDeleted) {
            return res.status(500).json({ message: '게시글 삭제 중 오류가 발생했습니다.' });
        }

        res.status(200).json({ message: '게시글이 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 좋아요 추가
exports.likePostHandler = (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const postId = parseInt(req.params.id, 10);

        // 게시글 존재 확인
        const post = findPostById(postId);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 좋아요 처리
        if (!post.likedUsers) {
            post.likedUsers = [];
        }

        if (!post.likedUsers.includes(req.session.user.id)) {
            post.likedUsers.push(req.session.user.id);
            post.likes += 1;

            updatePost(postId, { likes: post.likes, likedUsers: post.likedUsers });
            return res.status(200).json({ message: '좋아요를 추가했습니다.', likes: post.likes });
        } else {
            return res.status(400).json({ message: '이미 좋아요를 눌렀습니다.' });
        }
    } catch (error) {
        console.error('좋아요 추가 오류:', error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 좋아요 취소
exports.unlikePostHandler = (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const postId = parseInt(req.params.id, 10);

        // 게시글 존재 확인
        const post = findPostById(postId);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 좋아요 취소 처리
        if (post.likedUsers && post.likedUsers.includes(req.session.user.id)) {
            post.likedUsers = post.likedUsers.filter(userId => userId !== req.session.user.id);
            post.likes -= 1;

            updatePost(postId, { likes: post.likes, likedUsers: post.likedUsers });
            return res.status(200).json({ message: '좋아요를 취소했습니다.', likes: post.likes });
        } else {
            return res.status(400).json({ message: '좋아요를 누르지 않았습니다.' });
        }
    } catch (error) {
        console.error('좋아요 취소 오류:', error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};
