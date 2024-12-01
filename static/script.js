const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Canvas drawing settings
ctx.lineWidth = 12;
ctx.lineCap = 'round';
ctx.strokeStyle = 'black';

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

let drawing = false;

// Start drawing
canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

// Draw as the mouse moves
canvas.addEventListener('mousemove', (e) => {
    if (drawing) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }
});

// Stop drawing
canvas.addEventListener('mouseup', () => {
    drawing = false;
});

// Clear the canvas
function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    document.getElementById('prediction').innerText = '-';
}

// Predict the digit
function predictDigit() {
    const dataUrl = canvas.toDataURL();

    resizeImage(dataUrl, 28, 28).then((resizedImage) => {
        const image = dataURLtoBlob(resizedImage);

        const formData = new FormData();
        formData.append('image', image, 'digit.png');

        $.ajax({
            url: '/predict',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: (response) => {
                document.getElementById('prediction').innerText = "Predicted Digit: " + response.digit;
            },
            error: () => {
                alert('Error during prediction!');
            }
        });
    }).catch(() => {
        alert('Error resizing image!');
    });
}

// Send feedback
function sendFeedback() {
    const correctDigit = document.getElementById('correctDigit').value;

    if (correctDigit === '') {
        alert('Please enter the correct digit.');
        return;
    }

    const dataUrl = canvas.toDataURL();

    resizeImage(dataUrl, 28, 28).then((resizedImage) => {
        const image = dataURLtoBlob(resizedImage);

        const formData = new FormData();
        formData.append('image', image, 'digit.png');
        formData.append('correct_digit', correctDigit);

        $.ajax({
            url: '/retrain',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: (response) => {
                alert(response.message);
            },
            error: () => {
                alert('Error sending feedback!');
            }
        });
    }).catch(() => {
        alert('Error resizing image!');
    });
}

// Resize image from data URL
function resizeImage(dataUrl, width, height) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL());
        };
        img.onerror = reject;
    });
}

// Convert data URL to Blob
function dataURLtoBlob(dataURL) {
    const byteString = atob(dataURL.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/png' });
}
