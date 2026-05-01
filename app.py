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

# Compute class distribution (fixed, from full dataset)
spam_count = int(df['label_num'].sum())
ham_count  = int(len(df) - spam_count)

# ---------------------------
# Model state (mutable on retrain)
# ---------------------------
model      = None
vectorizer = None
accuracy   = None
cm         = None

# Prior probabilities (P(spam) and P(ham) from training set)
prior_spam = None
prior_ham  = None


def train(random_state=42):
    """Train (or retrain) the Naive Bayes model and update module-level globals."""
    global model, vectorizer, accuracy, cm, prior_spam, prior_ham

    X_train, X_test, y_train, y_test = train_test_split(
        df['message'], df['label_num'],
        test_size=0.2, random_state=random_state
    )

    # Prior probabilities from training labels
    prior_spam = float(y_train.mean())
    prior_ham  = float(1 - prior_spam)

    vectorizer = CountVectorizer()
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec  = vectorizer.transform(X_test)

    model = MultinomialNB()
    model.fit(X_train_vec, y_train)

    y_pred   = model.predict(X_test_vec)
    accuracy = accuracy_score(y_test, y_pred)
    cm       = confusion_matrix(y_test, y_pred)

    return accuracy


def get_top_words(msg_vec, n=10):
    """
    Return the top-n words from the message that most strongly push toward
    spam (positive log-ratio) or ham (negative), sorted by absolute impact.

    Returns a list of dicts: [{"word": str, "score": float, "direction": "spam"|"ham"}, ...]
    """
    feature_names = np.array(vectorizer.get_feature_names_out())

    # Log probability difference: log P(word|spam) - log P(word|ham)
    # model.feature_log_prob_ shape: (n_classes, n_features)
    # class 0 = ham, class 1 = spam
    log_ratio = model.feature_log_prob_[1] - model.feature_log_prob_[0]

    # Only consider words present in the message
    msg_array = msg_vec.toarray()[0]
    present_indices = np.where(msg_array > 0)[0]

    if len(present_indices) == 0:
        return []

    word_scores = [(feature_names[i], float(log_ratio[i])) for i in present_indices]
    word_scores.sort(key=lambda x: abs(x[1]), reverse=True)
    word_scores = word_scores[:n]

    return [
        {
            "word":      w,
            "score":     round(s, 4),
            "direction": "spam" if s > 0 else "ham"
        }
        for w, s in word_scores
    ]


# ------ Initial training on startup ------
_init_acc = train(random_state=42)
print(f"\n✅ Model trained successfully!")
print(f"   Accuracy  : {round(_init_acc * 100, 2)}%")
print(f"   Ham       : {ham_count}, Spam: {spam_count}")
print(f"   P(Spam)   : {round(prior_spam * 100, 2)}%  |  P(Ham): {round(prior_ham * 100, 2)}%")


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
    Output: JSON {
        "prediction"  : "Spam" or "Ham",
        "prob_spam"   : float,   # posterior P(Spam | message)
        "prob_ham"    : float,   # posterior P(Ham  | message)
        "prior_spam"  : float,   # P(Spam) from training set
        "prior_ham"   : float,   # P(Ham)  from training set
        "confidence"  : float,   # |prob_spam - prob_ham|
        "top_words"   : list     # [{word, score, direction}, ...]
    }
    """
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({"error": "No message provided"}), 400

    message = data['message'].strip()
    if not message:
        return jsonify({"error": "Message is empty"}), 400

    # Vectorize
    msg_vec = vectorizer.transform([message])

    # Posterior probabilities from model
    prob = model.predict_proba(msg_vec)[0]  # [P(ham|msg), P(spam|msg)]

    prob_ham  = float(prob[0])
    prob_spam = float(prob[1])

    # Threshold-based classification (default 0.5 — matches JS SPAM_THRESHOLD)
    prediction = "Spam" if prob_spam >= 0.5 else "Ham"

    # Confidence: absolute difference between posteriors
    confidence = abs(prob_spam - prob_ham)

    # Top contributing words (log-likelihood ratio, filtered to message vocab)
    top_words = get_top_words(msg_vec, n=10)

    return jsonify({
        "prediction":  prediction,
        "prob_spam":   round(prob_spam, 4),
        "prob_ham":    round(prob_ham,  4),
        "prior_spam":  round(prior_spam, 4),
        "prior_ham":   round(prior_ham,  4),
        "confidence":  round(confidence, 4),
        "top_words":   top_words
    })


@app.route('/stats', methods=['GET'])
def stats():
    """Return model statistics: class distribution, accuracy, confusion matrix."""
    return jsonify({
        "ham_count":        ham_count,
        "spam_count":       spam_count,
        "accuracy":         round(float(accuracy) * 100, 2),
        "confusion_matrix": cm.tolist()
    })


@app.route('/retrain', methods=['POST'])
def retrain():
    """
    Retrain the model with a fresh random train-test split.
    Returns updated accuracy and confusion matrix so the UI can refresh.
    """
    import random
    new_seed = random.randint(0, 99999)
    new_acc  = train(random_state=new_seed)

    print(f"🔄 Retrained (seed={new_seed})  →  Accuracy: {round(new_acc * 100, 2)}%")

    return jsonify({
        "accuracy":         round(float(new_acc) * 100, 2),
        "confusion_matrix": cm.tolist(),
        "seed":             new_seed
    })


# ---------------------------
# Run Server
# ---------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)
