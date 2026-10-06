import io
import os

import torch
import torch.nn as nn
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from PIL import Image, UnidentifiedImageError
from torchvision import models, transforms

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "efficientnet_model.pth")

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Matches the training code exactly for image preprocessing.
# The RandomHorizontalFlip is a training augmentation and is not used for inference.
transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
])

model = None


def load_model():
    global model
    if model is not None:
        return model

    try:
        model_instance = models.efficientnet_b0(weights=None)
        model_instance.classifier[1] = nn.Linear(
            model_instance.classifier[1].in_features,
            2,
        )

        checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
        model_instance.load_state_dict(checkpoint)
        model_instance.to(DEVICE)
        model_instance.eval()
        model = model_instance
        return model
    except Exception as exc:
        raise RuntimeError(f"Model loading failed: {exc}") from exc


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        load_model()
    except Exception:
        return jsonify({"error": "Model failed to load. Please check the model file and environment."}), 500

    file = request.files.get("image")
    if file is None or file.filename == "":
        return jsonify({"error": "No image selected."}), 400

    filename = file.filename.lower()
    if not (filename.endswith(".jpg") or filename.endswith(".jpeg")):
        return jsonify({"error": "Invalid file type. Please upload a JPG or JPEG image."}), 400

    try:
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("RGB")
    except UnidentifiedImageError:
        return jsonify({"error": "Invalid image file. Please upload a valid JPG or JPEG image."}), 400
    except Exception:
        return jsonify({"error": "Invalid image file. Please upload a valid JPG or JPEG image."}), 400

    try:
        input_tensor = transform(image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence_value, predicted_index = torch.max(probabilities, dim=1)

        predicted_index = int(predicted_index.item())
        confidence = float(confidence_value.item() * 100)

        # Matches the training code: class 1 is REAL and class 0 is FAKE.
        prediction = "REAL" if predicted_index == 1 else "FAKE"

        return jsonify({
            "prediction": prediction,
            "confidence": round(confidence, 1),
        })
    except Exception:
        return jsonify({"error": "Prediction failed. Please try a different image."}), 500


if __name__ == "__main__":
    try:
        load_model()
        print("Model loaded successfully ✅")
    except Exception as exc:
        print(f"Model failed to load: {exc}")

    app.run(host="0.0.0.0", port=5000, debug=False)
