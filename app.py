from flask import Flask, render_template, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
import base64

app = Flask(__name__)

# -----------------------------
# Load Trained CNN Model
# -----------------------------
model = tf.keras.models.load_model("model.keras")


# -----------------------------
# Home Page
# -----------------------------
@app.route("/")
def home():
    return render_template("index.html")


# -----------------------------
# Image Preprocessing
# -----------------------------
def preprocess_image(image):

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Invert colors
    gray = 255 - gray

    # Blur
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    # Threshold
    _, thresh = cv2.threshold(
        gray,
        50,
        255,
        cv2.THRESH_BINARY
    )

    # Find digit contour
    contours, _ = cv2.findContours(
        thresh,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    if len(contours) > 0:

        cnt = max(contours, key=cv2.contourArea)

        x, y, w, h = cv2.boundingRect(cnt)

        digit = thresh[y:y+h, x:x+w]

    else:

        digit = thresh

    # Create square canvas
    size = max(digit.shape) + 20

    canvas = np.zeros((size, size), dtype=np.uint8)

    x_offset = (size - digit.shape[1]) // 2
    y_offset = (size - digit.shape[0]) // 2

    canvas[
        y_offset:y_offset + digit.shape[0],
        x_offset:x_offset + digit.shape[1]
    ] = digit

    # Resize to MNIST size
    canvas = cv2.resize(canvas, (28, 28))

    canvas = canvas.astype("float32") / 255.0

    canvas = canvas.reshape(1, 28, 28, 1)

    return canvas


# -----------------------------
# Predict
# -----------------------------
@app.route("/predict", methods=["POST"])
def predict():

    data = request.json["image"]

    encoded = data.split(",")[1]

    image = base64.b64decode(encoded)

    npimg = np.frombuffer(image, np.uint8)

    image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    processed = preprocess_image(image)

    prediction = model.predict(processed, verbose=0)

    digit = int(np.argmax(prediction))

    confidence = float(np.max(prediction) * 100)

    top3_indices = np.argsort(prediction[0])[-3:][::-1]

    top3 = []

    for idx in top3_indices:

        top3.append({

            "digit": int(idx),

            "confidence": round(float(prediction[0][idx] * 100), 2)

        })

    return jsonify({

        "digit": digit,

        "confidence": round(confidence, 2),

        "top3": top3

    })


# -----------------------------
# Run Flask
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)