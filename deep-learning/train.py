import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, classification_report, precision_score, recall_score, f1_score
import seaborn as sns
import os

print("="*60)
print("Driver Vigilance Monitoring - Deep Learning (Version Optimisée)")
print("="*60)

# ============================================
# 1. DETECTION DU MATERIEL (GPU/CPU)
# ============================================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"\nDevice utilise: {device}")

# ============================================
# 2. TRANSFORMATIONS DES IMAGES (DATA AUGMENTATION)
# ============================================
transform_train = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    transforms.RandomGrayscale(p=0.1),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

transform_val = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# ============================================
# 3. CHARGEMENT DU DATASET
# ============================================
print("\nChargement du dataset...")

if not os.path.exists("dataset/train"):
    print("Erreur: le dossier dataset/train n'existe pas")
    exit()

train_dataset = datasets.ImageFolder("dataset/train", transform=transform_train)
val_dataset = datasets.ImageFolder("dataset/val", transform=transform_val)
test_dataset = datasets.ImageFolder("dataset/test", transform=transform_val)

print(f"Train: {len(train_dataset)} images")
print(f"Validation: {len(val_dataset)} images")
print(f"Test: {len(test_dataset)} images")
print(f"Classes: {train_dataset.classes}")

# ============================================
# 4. DATALOADERS
# ============================================
batch_size = 32
train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

# ============================================
# 5. MODELE RESNET50 AVEC TRANSFER LEARNING
# ============================================
print("\nConstruction du modele ResNet50...")
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)

for param in model.parameters():
    param.requires_grad = False

for param in model.layer4.parameters():
    param.requires_grad = True
for param in model.fc.parameters():
    param.requires_grad = True

num_features = model.fc.in_features
model.fc = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(num_features, 512),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(512, 2)
)

model = model.to(device)
print("Modele ResNet50 pret (fine-tuning active)")

# ============================================
# 6. FONCTION DE PERTE AVEC POIDS (WEIGHTED LOSS)
# ============================================
print("\nApplication de la fonction de perte avec poids...")
class_weights = torch.tensor([1.0, 3.0]).to(device)
criterion = nn.CrossEntropyLoss(weight=class_weights)
print(f"Poids: Active = 1.0, Fatigue = 3.0")

optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=0.00005)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=3, factor=0.5)

# ============================================
# 7. ENTRAINEMENT
# ============================================
print("\nDebut de l'entrainement...")
print("-"*60)

epochs = 10
train_losses = []
val_losses = []
train_accs = []
val_accs = []
best_val_acc = 0
patience = 5
counter = 0

for epoch in range(epochs):
    model.train()
    running_loss = 0.0
    correct_train = 0
    total_train = 0
    
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total_train += labels.size(0)
        correct_train += predicted.eq(labels).sum().item()
    
    train_loss = running_loss / len(train_loader)
    train_acc = 100. * correct_train / total_train
    train_losses.append(train_loss)
    train_accs.append(train_acc)
    
    model.eval()
    val_loss = 0.0
    correct_val = 0
    total_val = 0
    val_preds = []
    val_labels_list = []
    
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            val_loss += loss.item()
            _, predicted = outputs.max(1)
            total_val += labels.size(0)
            correct_val += predicted.eq(labels).sum().item()
            val_preds.extend(predicted.cpu().numpy())
            val_labels_list.extend(labels.cpu().numpy())
    
    val_loss = val_loss / len(val_loader)
    val_acc = 100. * correct_val / total_val
    val_losses.append(val_loss)
    val_accs.append(val_acc)
    
    recall_fatigue = recall_score(val_labels_list, val_preds, labels=[1], average='micro') if 1 in val_labels_list else 0
    
    scheduler.step(val_loss)
    
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        counter = 0
        torch.save(model.state_dict(), "best_model.pth")
        print(f"Meilleur modele sauvegarde (Val Acc: {val_acc:.2f}%)")
    else:
        counter += 1
        if counter >= patience:
            print(f"\nEarly stopping a l'epoch {epoch+1}")
            break
    
    print(f"Epoch [{epoch+1:2d}/{epochs}] | Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}% | Recall(Fatigue): {recall_fatigue:.4f}")

print("-"*60)
print("Entrainement termine")

# ============================================
# 8. COURBES D'APPRENTISSAGE
# ============================================
print("\nGeneration des courbes d'apprentissage...")

plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.plot(train_losses, label='Train Loss', color='blue', linewidth=2)
plt.plot(val_losses, label='Validation Loss', color='red', linewidth=2)
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.title('Courbes de perte (Loss)')
plt.grid(True, alpha=0.3)

plt.subplot(1, 2, 2)
plt.plot(train_accs, label='Train Accuracy', color='blue', linewidth=2)
plt.plot(val_accs, label='Validation Accuracy', color='red', linewidth=2)
plt.xlabel('Epoch')
plt.ylabel('Accuracy (%)')
plt.legend()
plt.title('Courbes d\'exactitude (Accuracy)')
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('training_curves.png', dpi=150)
plt.show()
print("training_curves.png sauvegarde")

# ============================================
# 9. EVALUATION SUR LE TEST SET
# ============================================
print("\nEvaluation sur l'ensemble de test...")

model.load_state_dict(torch.load("best_model.pth"))
model.eval()

all_preds = []
all_labels = []

with torch.no_grad():
    for images, labels in test_loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        _, predicted = outputs.max(1)
        all_preds.extend(predicted.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

# ============================================
# 10. MATRICE DE CONFUSION
# ============================================
print("\nMatrice de confusion...")
cm = confusion_matrix(all_labels, all_preds)

plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=train_dataset.classes, 
            yticklabels=train_dataset.classes,
            annot_kws={'size': 14})
plt.xlabel('Prediction')
plt.ylabel('Reel')
plt.title('Matrice de confusion - Test Set')
plt.savefig('confusion_matrix.png', dpi=150)
plt.show()
print("confusion_matrix.png sauvegarde")

# ============================================
# 11. METRIQUES DETAILLEES
# ============================================
print("\nClassification Report:")
print(classification_report(all_labels, all_preds, target_names=train_dataset.classes))

precision = precision_score(all_labels, all_preds, average='weighted')
recall = recall_score(all_labels, all_preds, average='weighted')
f1 = f1_score(all_labels, all_preds, average='weighted')
recall_fatigue = recall_score(all_labels, all_preds, labels=[1], average='micro')

print("\nMetriques finales:")
print(f"Precision (ponderee): {precision:.4f}")
print(f"Recall (pondere):     {recall:.4f}")
print(f"F1-Score (pondere):   {f1:.4f}")
print(f"Recall (Fatigue):     {recall_fatigue:.4f}")

test_acc = 100. * (cm[0][0] + cm[1][1]) / sum(sum(cm))
print(f"\nTest Accuracy: {test_acc:.2f}%")

# ============================================
# 12. DETAIL PAR CLASSE
# ============================================
print("\nDetail par classe:")
for i, class_name in enumerate(train_dataset.classes):
    tp = cm[i][i]
    fp = sum(cm[:, i]) - tp
    fn = sum(cm[i, :]) - tp
    tn = sum(sum(cm)) - tp - fp - fn
    
    precision_class = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall_class = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1_class = 2 * (precision_class * recall_class) / (precision_class + recall_class) if (precision_class + recall_class) > 0 else 0
    
    print(f"\n{class_name.upper()}:")
    print(f"   Precision: {precision_class:.4f}")
    print(f"   Recall:    {recall_class:.4f}")
    print(f"   F1-Score:  {f1_class:.4f}")

# ============================================
# 13. RESUME FINAL
# ============================================
print("\n" + "="*60)
print("RESUME FINAL")
print("="*60)
print(f"Test Accuracy:           {test_acc:.2f}%")
print(f"F1-Score (pondere):      {f1:.4f}")
print(f"Recall (Fatigue):        {recall_fatigue:.4f}")
print("\nFichiers generes:")
print("   - best_model.pth")
print("   - training_curves.png")
print("   - confusion_matrix.png")
print("="*60)

# ============================================
# 14. SAUVEGARDE DES RESULTATS
# ============================================
with open("training_results.txt", "w") as f:
    f.write("Driver Vigilance Monitoring - Resultats d'entrainement\n")
    f.write("="*60 + "\n")
    f.write(f"Device utilise: {device}\n")
    f.write(f"Test Accuracy: {test_acc:.2f}%\n")
    f.write(f"F1-Score: {f1:.4f}\n")
    f.write(f"Precision: {precision:.4f}\n")
    f.write(f"Recall: {recall:.4f}\n")
    f.write(f"Recall (Fatigue): {recall_fatigue:.4f}\n")
    f.write("\nClassification Report:\n")
    f.write(classification_report(all_labels, all_preds, target_names=train_dataset.classes))

print("\ntraining_results.txt sauvegarde")
print("\nProjet Deep Learning termine avec succes")