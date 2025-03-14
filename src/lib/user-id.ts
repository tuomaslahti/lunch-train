import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

const USER_ID_COOKIE = 'lunch_train_user_id';
const NICKNAME_COOKIE = 'lunch_train_nickname';

export const getUserInfo = (): { userId: string; nickname: string | null } => {
    let userId = Cookies.get(USER_ID_COOKIE);
    if (!userId) {
        userId = uuidv4();
        Cookies.set(USER_ID_COOKIE, userId, { expires: 365 }); // Cookie expires in 1 year
    }
    const nickname = Cookies.get(NICKNAME_COOKIE);
    return { userId, nickname: nickname || null };
};

export const saveNickname = (nickname: string): void => {
    Cookies.set(NICKNAME_COOKIE, nickname, { expires: 365 }); // Cookie expires in 1 year
}; 