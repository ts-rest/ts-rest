
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export interface Post {
    id: string;
    title: string;
    description?: Nullable<string>;
    content?: Nullable<string>;
    published: boolean;
    author: User;
    authorId: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    posts: Post[];
}

export interface IQuery {
    posts(): Post[] | Promise<Post[]>;
    post(id: string): Nullable<Post> | Promise<Nullable<Post>>;
    users(): User[] | Promise<User[]>;
    user(id: string): Nullable<User> | Promise<Nullable<User>>;
}

export interface IMutation {
    createPost(title: string, published: boolean, authorId: string, description?: Nullable<string>, content?: Nullable<string>): Nullable<Post> | Promise<Nullable<Post>>;
}

type Nullable<T> = T | null;
