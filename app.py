"""
Flask backend for the Spam Detection System (PSP Project).
Trains a Naive Bayes classifier on startup and serves predictions via API.
"""

from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, confusion_matrix

# ---------------------------
# Initialize Flask App
# ---------------------------
app = Flask(__name__)

# ---------------------------
# STEP 1: Load Dataset
# ---------------------------
df = pd.read_csv("spam.csv", encoding='latin-1')
df = df[['v1', 'v2']]
df.columns = ['label', 'message']

# ---------------------------
# STEP 2: Convert Labels
# ---------------------------
df['label_num'] = df['label'].map({'ham': 0, 'spam': 1})

# ---------------------------
# STEP 3: Train-Test Split
# ---------------------------
X_train, X_test, y_train, y_test = train_test_split(
    df['message'], df['label_num'], test_size=0.2, random_state=42
)

# ---------------------------
# STEP 4: Vectorize Text
# ---------------------------
vectorizer = CountVectorizer()
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# ---------------------------
# STEP 5: Train Model
# ---------------------------
model = MultinomialNB()
model.fit(X_train_vec, y_train)

# ---------------------------
# STEP 6: Evaluate Model
# ---------------------------
y_pred = model.predict(X_test_vec)
accuracy = accuracy_score(y_test, y_pred)
cm = confusion_matrix(y_test, y_pred)

# Compute class distribution
spam_count = int(df['label_num'].sum())
ham_count = int(len(df) - spam_count)

print(f"\n✅ Model trained successfully!")
print(f"   Accuracy: {round(accuracy * 100, 2)}%")
print(f"   Ham: {ham_count}, Spam: {spam_count}")

# ---------------------------
# ROUTES
# ---------------------------

@app.route('/')
def index():
    """Serve the main frontend page."""
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict whether a message is spam or ham.
    Input:  JSON { "message": "text" }
    Output: JSON { "prediction": "Spam"/"Ham", "prob_spam": float, "prob_ham": float }
    """
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({"error": "No message provided"}), 400

    message = data['message'].strip()

    if not message:
        return jsonify({"error": "Message is empty"}), 400

    # Vectorize and predict
    msg_vec = vectorizer.transform([message])
    prob = model.predict_proba(msg_vec)[0]

    prediction = "Spam" if prob[1] > prob[0] else "Ham"

    return jsonify({
        "prediction": prediction,
        "prob_spam": round(float(prob[1]), 4),
        "prob_ham": round(float(prob[0]), 4)
    })


@app.route('/stats', methods=['GET'])
def stats():
    """
    Return model statistics.
    Output: class distribution and model accuracy, plus confusion matrix.
    """
    return jsonify({
        "ham_count": ham_count,
        "spam_count": spam_count,
        "accuracy": round(float(accuracy) * 100, 2),
        "confusion_matrix": cm.tolist()
    })


# ---------------------------
# Run Server
# ---------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)
