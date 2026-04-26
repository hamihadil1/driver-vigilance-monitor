import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import os

class DriverVigilanceModel:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self.load_model()
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            #                         mean                   std
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        self.classes = ['active', 'fatigue']
    
    def load_model(self):
        model = models.resnet50(weights=None)
        
        num_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 2)
        )
        
        model_path = os.path.join(os.path.dirname(__file__), 'best_model.pth')
        if os.path.exists(model_path):
            model.load_state_dict(torch.load(model_path, map_location=self.device))
            print("Modele charge avec succes")
        else:
            print("Fichier best_model.pth non trouve")
        
        model = model.to(self.device)
        model.eval()
        return model
    
    def predict(self, image):
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            _, predicted = outputs.max(1)
        
        result = self.classes[predicted.item()]
        confidence = probabilities[0][predicted.item()].item()
        
        return result, confidence

model_instance = DriverVigilanceModel()