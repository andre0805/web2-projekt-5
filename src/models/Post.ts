class Post {
    id: string;
    author: string;
    publishedAt: Date;
    title: string;
    description: string | null;
    likes: number;
    userLiked: boolean = false;

    dateString: string;

    constructor(id: string, author: string, publishedAt: Date, title: string, description: string | null, likes: number, userLiked: boolean = false) {
        this.id = id;
        this.author = author;
        this.publishedAt = publishedAt;
        this.title = title;
        this.description = description;
        this.likes = likes;
        this.userLiked = userLiked;

        // format to "January 1, 2021"
        this.dateString = this.publishedAt.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
    }
}

export default Post;
