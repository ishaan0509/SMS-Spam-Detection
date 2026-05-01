import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, confusion_matrix, ConfusionMatrixDisplay

# ---------------------------
# STEP 1: Load Dataset
# ---------------------------
df = pd.read_csv("spam.csv", encoding='latin-1')

# Keep only useful columns
df = df[['v1', 'v2']]
df.columns = ['label', 'message']

print("\nSample Data:\n", df.head())

# ---------------------------
# STEP 2: Convert Labels
# ---------------------------
df['label_num'] = df['label'].map({'ham': 0, 'spam': 1})

# ---------------------------
# STEP 3: PSP Insight (Probability)
# ---------------------------
print("\n--- Prior Probabilities ---")
print(df['label'].value_counts(normalize=True))

# ---------------------------
# STEP 4: Visualization
# ---------------------------
df['label'].value_counts().plot(kind='bar')
plt.title("Spam vs Ham Distribution")
plt.xlabel("Class")
plt.ylabel("Count")
plt.show()

# ---------------------------
# STEP 5: Train-Test Split (Randomness)
# ---------------------------
X_train, X_test, y_train, y_test = train_test_split(
    df['message'], df['label_num'], test_size=0.2, random_state=42
)

# ---------------------------
# STEP 6: Text → Numbers
# ---------------------------
vectorizer = CountVectorizer()
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# ---------------------------
# STEP 7: Train Model
# ---------------------------
model = MultinomialNB()
model.fit(X_train_vec, y_train)

# ---------------------------
# STEP 8: Prediction
# ---------------------------
y_pred = model.predict(X_test_vec)

# ---------------------------
# STEP 9: Accuracy
# ---------------------------
accuracy = accuracy_score(y_test, y_pred)
print("\nModel Accuracy:", round(accuracy * 100, 2), "%")

# ---------------------------
# STEP 10: Confusion Matrix
# ---------------------------
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Ham", "Spam"])
disp.plot()
plt.title("Confusion Matrix")
plt.show()

# ---------------------------
# STEP 11: Interactive Prediction
# ---------------------------
print("\n--- PSP-Based Spam Classifier Ready ---")

while True:
    user_input = input("\nEnter a message (or type 'exit' to quit): ")

    if user_input.lower() == 'exit':
        print("Exiting program...")
        break

    msg_vec = vectorizer.transform([user_input])
    prob = model.predict_proba(msg_vec)[0]

    print("\nMessage:", user_input)
    print("Probability Ham:", round(prob[0], 4))
    print("Probability Spam:", round(prob[1], 4))

    if prob[1] > prob[0]:
        print("Prediction: 🚫 SPAM")
    else:
        print("Prediction: ✅ HAM")