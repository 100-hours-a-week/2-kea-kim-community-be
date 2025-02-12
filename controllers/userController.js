const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const { updateUser, createUser, findUserByEmailAndPassword, findUserById, deleteUser } = require('../models/userModel');
const { deletePostsByUser } = require("../models/postModel");
const { deleteCommentsByUser } = require("../models/commentModel");

// 회원가입 컨트롤러
exports.registerUser = (req, res) => {
    try {
        const { email, password, nickname } = req.body;
        const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

        if (!email || !password || !nickname) {
            return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
        }

        const newUser = createUser({ email, password, nickname, profilePic });

        if (!newUser) {
            return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
        }

        res.status(201).json({ message: '회원가입이 완료되었습니다.', user: newUser.id });
    } catch (error) {
        console.error('회원가입 에러:', error.message);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 로그인 컨트롤러
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: '이메일과 비밀번호를 모두 입력해주세요.' });
    }

    const user = await findUserByEmailAndPassword(email, password);

    if (user) {
        // 세션에 저장할 데이터에서 비밀번호를 제외
        const { password, ...userWithoutPassword } = user;
        req.session.user = userWithoutPassword;

        console.log('세션 저장 성공:', req.session.user);
        return res.status(200).json({ message: '로그인 성공', user: req.session.user });
    } else {
        return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
};

exports.getProfile = (req, res) => {
    console.log('현재 세션:', req.session); // 디버깅

    if (req.session && req.session.user && req.session.user.id) {
        const { password, ...userWithoutPassword } = req.session.user;
        return res.status(200).json(userWithoutPassword);
    } else {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }
};

// 특정 사용자 정보 조회
exports.getUserByIdHandler = (req, res) => {
    try {

        const userId = req.params.id;
        console.log(`Received userId: ${userId}`);

        const user = findUserById(parseInt(userId, 10));
    
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        return res.status(200).json({
            id: user.id,
            nickname: user.nickname,
            profilePic: user.profilePic,
            email: user.email
        });
    } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        return res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 사용자 정보 수정
exports.updateProfile = (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const userId = req.session.user.id;
        const { nickname } = req.body;
        const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

        const updatedUser = updateUser(userId, {
            nickname: nickname || undefined,
            profilePic: profilePic || undefined,
        });

        if (!updatedUser) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        req.session.user = {
            id: updatedUser.id,
            email: updatedUser.email,
            nickname: updatedUser.nickname,
            profilePic: updatedUser.profilePic,
        };

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('프로필 수정 오류:', error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 비밀번호 변경
exports.updatePassword = async (req, res) => {
    try {
        // 세션 확인
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const userId = req.session.user.id; 
        const { newPassword } = req.body;

        if (!newPassword || newPassword.trim() === "") {
            return res.status(400).json({ message: '새 비밀번호를 입력해주세요.' });
        }

        const user = findUserById(userId);

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 새 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 사용자 비밀번호 업데이트
        const updatedUser = updateUser(userId, { password: hashedPassword });

        if (!updatedUser) {
            return res.status(500).json({ message: '비밀번호 변경 중 오류가 발생했습니다.' });
        }

        res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};


// 로그아웃 컨트롤러
exports.logoutUser = (req, res) => {
    console.log("로그아웃 요청 받음:", req.session); // 디버깅

    req.session.destroy(err => {
        if (err) {
            console.error("세션 삭제 실패:", err);
            return res.status(500).json({ message: "로그아웃 실패" });
        }

        console.log("세션 삭제 성공!"); // 세션이 정상적으로 삭제되었는지 확인
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "로그아웃 성공" });
    });
};

// 회원 탈퇴 컨트롤러
exports.deleteAccount = (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }

        const userId = req.session.user.id;

        // 해당 사용자의 게시글 삭제
        const postsDeleted = deletePostsByUser(userId);

        // 해당 사용자의 댓글 삭제
        const commentsDeleted = deleteCommentsByUser(userId);

        // 회원 삭제 처리
        const isDeleted = deleteUser(userId);

        if (!isDeleted) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        // 세션 삭제
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: "회원 탈퇴 중 오류가 발생했습니다." });
            }

            res.clearCookie("connect.sid");
            return res.status(200).json({ message: "회원 탈퇴가 완료되었습니다." });
        });
    } catch (error) {
        console.error("회원 탈퇴 오류:", error);
        return res.status(500).json({ message: "서버 오류 발생" });
    }
};
