const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const USERS_FILE = path.join(__dirname, '../data/users.json');

// 모든 사용자 가져오기
function getUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]), 'utf8');
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return data ? JSON.parse(data) : [];
}

// 새로운 사용자 생성
async function createUser({ email, password, nickname, profilePic }) {
    const users = getUsers();

    // 이메일 중복 검사
    if (users.some(user => user.email === email)) {
        return null;
    }

    // 순차적인 ID 생성
    const newId = users.length > 0 ? users[users.length - 1].id + 1 : 1;

     // 비밀번호 해싱
     const hashedPassword = await bcrypt.hash(password, 10);

     const newUser = { 
         id: newId, 
         email, 
         nickname, 
         password: hashedPassword, 
         profilePic, 
         //createdAt: new Date().toISOString() 
     };
     users.push(newUser);
 
     fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
 
     return newUser;
 }

// 사용자 수정
function updateUser(id, updatedFields) {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === id);

    if (userIndex === -1) {
        return null;
    }

    // 기존 데이터를 유지하면서 수정된 필드만 업데이트
    users[userIndex] = {
        ...users[userIndex],
        ...Object.fromEntries(Object.entries(updatedFields).filter(([_, value]) => value !== undefined)),
        //updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');

    return users[userIndex];
}

// 사용자 찾기 (이메일과 비밀번호로)
async function findUserByEmailAndPassword(email, password) {
    const users = getUsers();
    const user = users.find(user => user.email === email);

    if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            return user;
        }
    }
    return null;
}

// 사용자 찾기 (ID로)
function findUserById(id) {
    const users = getUsers();
    return users.find(user => user.id === id);
}

// 특정 사용자 삭제 함수
function deleteUser(id) {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === id);

    if (userIndex === -1) {
        return false;
    }

    users.splice(userIndex, 1);

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
    return true;
}

module.exports = {
    getUsers,
    createUser,
    findUserByEmailAndPassword,
    findUserById,
    updateUser,
    deleteUser
};