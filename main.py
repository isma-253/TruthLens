import shutil
import os

from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# Image preprocessing

transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.ToTensor()
])

train_dataset = datasets.ImageFolder("dataset/train", transform=transform)
test_dataset = datasets.ImageFolder("dataset/test", transform=transform)

train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=8, shuffle=False)

# Print info
print("Dataset loaded successfully 🚀")
print("Train images:", len(train_dataset))
print("Test images:", len(test_dataset))
print("Classes:", train_dataset.classes)


from torchvision import models
import torch.nn as nn

model = models.efficientnet_b0(pretrained=True)


# تجميد أغلب المودل
for param in model.features[:-4].parameters():
    param.requires_grad = False

# فتح آخر 3 blocks
for param in model.features[-4:].parameters():
    param.requires_grad = True

# تغيير آخر طبقة
model.classifier[1] = nn.Linear(
    model.classifier[1].in_features,
    2
)

print("Model loaded successfully ✅")

import os
import torch

if os.path.exists("efficientnet_model.pth"):
    model.load_state_dict(torch.load("efficientnet_model.pth"))
    print("Loaded saved model ✅")

import torch.optim as optim
import torch

# Loss function and optimizer
criterion = torch.nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.0003)

# Training loop
epochs = 10

for epoch in range(epochs):
    total_loss = 0

    for images, labels in train_loader:
        outputs = model(images)
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss:.4f}")

print("Training completed 🚀")
#save model
torch.save(model.state_dict(), "efficientnet_model.pth")
print("Model saved 💾")

#Accuracy
import os
from torchvision.utils import save_image

os.makedirs("wrong_predictions/real", exist_ok=True)
os.makedirs("wrong_predictions/fake", exist_ok=True)

import shutil
import os

# حذف الفولدر القديم
if os.path.exists("wrong_predictions"):
    shutil.rmtree("wrong_predictions")

# إنشاء فولدرات جديدة
os.makedirs("wrong_predictions/real", exist_ok=True)
os.makedirs("wrong_predictions/fake", exist_ok=True)

correct = 0
total = 0

model.eval()

wrong_idx = 0

with torch.no_grad():
    for images, labels in test_loader:

        outputs = model(images)
        _, predicted = torch.max(outputs, 1)

        wrong_real = 0
wrong_fake = 0

for images, labels in test_loader:

    outputs = model(images)
    _, predicted = torch.max(outputs, 1)

    for i in range(len(predicted)):

        if predicted[i].item() != labels[i].item():

            # if real
            if labels[i].item() == 1:
                save_image(
                    images[i],
                    f"wrong_predictions/real/wrong_{wrong_real}.jpg"
                )
                wrong_real += 1

            # if fake
            else:
                save_image(
                    images[i],
                    f"wrong_predictions/fake/wrong_{wrong_fake}.jpg"
                )
                wrong_fake += 1

        
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

accuracy = 100 * correct / total

print(f"Accuracy: {accuracy:.2f}%")

#test
from PIL import Image

# Load and preprocess image
image_path = "test.jpg"  # حط صورة هنا
image = Image.open(image_path)

image = transform(image).unsqueeze(0)  # add batch dimension

# Prediction
model.eval()
with torch.no_grad():
    output = model(image)
    _, predicted = torch.max(output, 1)
    
    for i in range(len(predicted)):
      if predicted[i] != labels[i]:
        save_image(
            images[i],
            f"wrong_predictions/wrong_{i}.png"
        )

# Classes
classes = train_dataset.classes

print("Prediction:", classes[predicted.item()])
