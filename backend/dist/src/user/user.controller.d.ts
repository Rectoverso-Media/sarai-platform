import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findAll(): Promise<{
        id: number;
        email: string;
        name: string | null;
        createdAt: Date;
    }[]>;
    create(body: {
        email: string;
        name?: string;
    }): Promise<{
        id: number;
        email: string;
        name: string | null;
        createdAt: Date;
    }>;
}
