class Post {
    id: string;
    author: string;
    publishedAt: Date;
    title: string;
    description: string | null;
    likes: number;
    userLiked: boolean = false;
    imageUrl: string | null = null;
    
    dateString: string;

    constructor(id: string, author: string, publishedAt: Date, title: string, description: string | null, likes: number, userLiked: boolean = false, imageUrl: string | null = null) {
        this.id = id;
        this.author = author;
        this.publishedAt = publishedAt;
        this.title = title;
        this.description = description;
        this.likes = likes;
        this.userLiked = userLiked;
        this.imageUrl = imageUrl;

        // format to "January 1, 2021 16:00"
        this.dateString = this.publishedAt.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' });
    }
}

export default Post;
