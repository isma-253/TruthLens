# TruthLens

TruthLens is an AI-powered web application designed to classify human images as **REAL** or **AI-generated (FAKE)** using a deep learning model.

The project combines a trained computer vision model with a Flask-based web application, allowing users to upload an image and receive a prediction along with the model's confidence score.

## Features

- Classifies human images as **REAL** or **FAKE**
- Uses a fine-tuned **EfficientNet-B0** model
- Displays the model confidence for each prediction
- Simple image upload and preview
- Modern and responsive web interface
- Flask backend connected directly to the trained PyTorch model
- Real-time inference through the `/predict` endpoint

## Model

The classification model is based on **EfficientNet-B0** using transfer learning.

The final layers of the pretrained network were fine-tuned for binary classification:

- **REAL** — Real human images
- **FAKE** — AI-generated human images

The trained model achieved approximately **84% accuracy** on the project test dataset.

> Model confidence represents how confident the model is in its prediction. It does not guarantee that the prediction is correct.

## Technologies

### AI & Backend
- Python
- PyTorch
- Torchvision
- EfficientNet-B0
- Flask
- Pillow

### Frontend
- HTML
- CSS
- JavaScript

## How It Works

1. The user uploads a human image.
2. The frontend sends the image to the Flask `/predict` endpoint.
3. The backend preprocesses the image.
4. The trained EfficientNet-B0 model performs inference.
5. The model predicts **REAL** or **FAKE**.
6. The prediction and model confidence are returned to the frontend.

## Project Structure

```text
TruthLens/
├── app.py
├── efficientnet_model.pth
├── requirements.txt
├── templates/
│   └── index.html
├── static/
│   ├── script.js
│   ├── style.css
│   └── assets/
└── README.md
```

## Run Locally

Clone the repository:

```bash
git clone https://github.com/isma-253/TruthLens.git
```

Open the project directory:

```bash
cd TruthLens
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

Run the Flask application:

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Limitations

TruthLens is an experimental AI project and may incorrectly classify some images.

Performance can be affected by factors such as image quality, viewing angle, image generation technique, and differences between the training data and new images.

The confidence score should not be interpreted as guaranteed prediction accuracy.

## Author

**Isma**

AI Student | Python & AI Developer

GitHub: [isma-253](https://github.com/isma-253)