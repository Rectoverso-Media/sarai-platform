export declare class UserService {
    getUsers(): Promise<{
        id: number;
        email: string;
        name: string | null;
        createdAt: Date;
    }[]>;
    createUser(email: string, name?: string): Promise<{
        id: number;
        email: string;
        name: string | null;
        createdAt: Date;
    }>;
}
