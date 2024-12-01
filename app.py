import numpy as np
import tensorflow as tf
from PIL import Image
from flask import Flask, render_template, request, jsonify
import json
from pathlib import Path

app = Flask(__name__)

model = tf.keras.models.load_model('mnist_model.h5')

FEEDBACK_FILE = 'feedback.json'

if not Path(FEEDBACK_FILE).exists():
    with open(FEEDBACK_FILE, 'w') as f:
        json.dump([], f)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/predict', methods=['POST'])
def predict():
    img_data = request.files['image']
    img = Image.open(img_data.stream).convert('L')
    img = img.resize((28, 28))
    img_array = np.array(img)
    img_array_normalized = np.invert(img_array) / 255.0
    img_array_reshaped = img_array_normalized.reshape(1, 28, 28, 1)

    prediction = model.predict(img_array_reshaped)
    predicted_digit = np.argmax(prediction)

    return jsonify({'digit': int(predicted_digit)})

@app.route('/retrain', methods=['POST'])
def save_feedback():
    img_data = request.files['image']
    correct_label = int(request.form['correct_digit'])

    # Process the image
    img = Image.open(img_data.stream).convert('L')
    img = img.resize((28, 28))
    img_array = np.array(img)
    img_array_normalized = np.invert(img_array) / 255.0

    # Load existing feedback
    with open(FEEDBACK_FILE, 'r') as f:
        feedback_data = json.load(f)

    # Add new feedback
    feedback_data.append({
        "image": img_array_normalized.tolist(),
        "label": correct_label
    })

    # Save updated feedback
    with open(FEEDBACK_FILE, 'w') as f:
        json.dump(feedback_data, f)

    return jsonify({'message': 'Feedback saved successfully!'})

@app.route('/batch_retrain', methods=['POST'])
def batch_retrain():
    with open(FEEDBACK_FILE, 'r') as f:
        feedback_data = json.load(f)

    if not feedback_data:
        return jsonify({'message': 'No feedback data available for retraining.'})

    images = np.array([np.array(entry['image']) for entry in feedback_data])
    labels = np.array([entry['label'] for entry in feedback_data])

    images = images.reshape(-1, 28, 28)  
    images = tf.keras.utils.normalize(images, axis=1) 

    labels = labels.astype("int32")

    model.fit(images, labels, epochs=3, verbose=1)

    model.save('mnist_model.h5')

    with open(FEEDBACK_FILE, 'w') as f:
        json.dump([], f)

    return jsonify({'message': 'Model retrained successfully.'})


if __name__ == '__main__':
    app.run(debug=True)
