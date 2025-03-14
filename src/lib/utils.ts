export const getInitials = (nickname: string): string => {
    return nickname
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}; 