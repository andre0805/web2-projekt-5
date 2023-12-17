document.addEventListener('DOMContentLoaded', function() {
    // This function will be executed once the DOM is fully loaded
    console.log('JavaScript file loaded successfully!');
    
    const likeButton = document.getElementById('like-button');

    likeButton.onclick = async function () {
        const postId = likeButton.dataset.post_id;
        await fetch(`/like/${postId}`)
        window.location.reload();
    }
});