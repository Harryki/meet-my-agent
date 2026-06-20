const USERS_KEY = 'notion-clone-users';
const CURRENT_USER_KEY = 'notion-clone-current-user';

function safeGet(key, defaultValue) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeSet(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export function getUsers() {
  return safeGet(USERS_KEY, []);
}

export function getCurrentUserEmail() {
  return safeGet(CURRENT_USER_KEY, null);
}

export function findUser(email) {
  return getUsers().find((u) => u.email === email) || null;
}

export function signup(email, password) {
  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    return { success: false, error: '이미 등록된 이메일입니다.' };
  }
  users.push({ email, password });
  safeSet(USERS_KEY, users);
  safeSet(CURRENT_USER_KEY, email);
  return { success: true, user: { email } };
}

export function login(email, password) {
  const user = findUser(email);
  if (!user) {
    return { success: false, error: '등록되지 않은 계정입니다.' };
  }
  if (user.password !== password) {
    return { success: false, error: '비밀번호가 일치하지 않습니다.' };
  }
  safeSet(CURRENT_USER_KEY, email);
  return { success: true, user: { email } };
}

export function logout() {
  safeSet(CURRENT_USER_KEY, null);
}

export function getFilesKey(email) {
  return `notion-clone-files-${email}`;
}

export function loadFiles(email) {
  return safeGet(getFilesKey(email), []);
}

export function saveFiles(email, files) {
  safeSet(getFilesKey(email), files);
}
