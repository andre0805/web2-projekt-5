document.addEventListener('DOMContentLoaded', function () {
    // This function will be executed once the DOM is fully loaded
    console.log('JavaScript file loaded successfully!');


    let player = document.getElementById("player");
    let canvas = document.getElementById("canvas");

    let beforeSnap = document.getElementById("before_snap");
    let afterSnap = document.getElementById("after_snap");

    let title = document.getElementById("title");
    let description = document.getElementById("description");
    let systemImage = document.getElementById("system_image");

    let snapButton = document.getElementById("snap_button");
    let uploadButton = document.getElementById("upload_button");

    let startCapture = function () {
        beforeSnap.hidden = false;
        afterSnap.hidden = true;
        
        if (!("mediaDevices" in navigator)) {
            alert("Your browser does not support media devices. Use different browser or upload image from your device.");
        } else {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: false })
                .then((stream) => {
                    player.srcObject = stream;
                })
                .catch((err) => {
                    alert("Media stream not working");
                    console.log(err);
                });
        }
    };

    let stopCapture = function () {
        beforeSnap.hidden = true;
        afterSnap.hidden = false;

        player.srcObject.getVideoTracks().forEach(function (track) {
            track.stop();
        });
    };

    startCapture();

    snapButton
        .addEventListener("click", function (event) {
            canvas.width = player.getBoundingClientRect().width;
            canvas.height = player.getBoundingClientRect().height;
            
            canvas
                .getContext("2d")
                .drawImage(player, 0, 0, canvas.width, canvas.height);
            
            stopCapture();
        });
    
    systemImage
        .addEventListener("change", function (event) {
            const file = event.target.files[0];

            if (file) {
                const reader = new FileReader();

                reader.onload = function (e) {
                    const imageData = e.target.result;
                    
                    const image = new Image();
                    image.src = imageData;
                    
                    image.onload = function () {
                        canvas.width = image.width;
                        canvas.height = image.height;
                        canvas
                            .getContext("2d")
                            .drawImage(image, 0, 0, canvas.width, canvas.height);
                        
                        stopCapture();
                    };
                };

                // Read the file as a data URL
                reader.readAsDataURL(file);
            }
        });

    uploadButton
        .addEventListener("click", async function (event) {
            event.preventDefault();

            if (isCanvasBlank(canvas)) {
                alert("Choose or capture an image!");
                return;
            }

            if (title.value === "") {
                alert("Title cannot be empty!");
                return;
            }
            
            if ("serviceWorker" in navigator && "SyncManager" in window) {
                let url = canvas.toDataURL();
                fetch(url)
                    .then((res) => res.blob())
                    .then((blob) => {
                        let date = new Date();
                        let postTitle = title.value;
                        let postDescription = description.value;
                        let id = date + "-" + postTitle;
                        set(id, {
                            id,
                            date,
                            title: postTitle,
                            description: postDescription,
                            image: blob,
                        });
                        return navigator.serviceWorker.ready;
                    })
                    .then((swRegistration) => {
                        return swRegistration.sync.register("sync-snaps");
                    })
                    .then(() => {
                        console.log("Queued for sync");
                        startCapture();
                    })
                    .catch((error) => {
                        alert(error);
                        console.log(error);
                    });
            } else {
                let url = canvas.toDataURL();
                fetch(url)
                    .then((res) => res.blob())
                    .then((blob) => {
                        console.log("blob:", blob);
                        

                        // Create a new FormData object
                        const formData = new FormData();
                        formData.append("id", uuidv4());
                        formData.append("title", title.value);
                        formData.append("description", description.value);
                        formData.append("image", blob);

                        fetch("/posts", {
                            method: "POST",
                            body: formData
                        })
                        .then((data) => {
                            console.log(data.blob());
                            window.location.href = "/posts";
                        })
                        .catch((error) => {
                            alert(`Error: ${error}`);
                            console.log('Error:', error);

                            // Check if the response is a valid JSON
                            return error.text().then(errorMessage => {
                                console.log('Error response:', errorMessage);
                            });
                        });
                    })
                    .catch((error) => {
                        alert(`Error: ${error}`);
                        console.log('Error:', error);
                    });

            }
        });

    

});

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// returns true if every pixel's uint32 representation is 0 (or "blank")
function isCanvasBlank(canvas) {
    const context = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(context.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    return !pixelBuffer.some(color => color !== 0);
}