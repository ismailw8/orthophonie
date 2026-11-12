let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token?: string | null): void => {
    accessToken = token || null;
};

export const clearAccessToken = (): void => {
    accessToken = null;
};
