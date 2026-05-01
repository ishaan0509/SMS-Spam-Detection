# 📩 Spam Detection using Probability (PSP Project)

A full-stack web application that classifies messages as **Spam** or **Ham (legitimate)** using **Naive Bayes Classification**, demonstrating real-world applications of **Probability and Stochastic Processes (PSP)**.

---

## 🚀 Project Overview

This project applies **Bayes’ Theorem** to determine the probability that a message is spam based on its content.
It combines **Machine Learning + Probability Theory + Web Development** into an interactive system.

---

## 🧠 PSP Concepts Demonstrated

* Conditional Probability
* Bayes’ Theorem
* Prior & Posterior Probability
* Random Sampling (Train-Test Split)
* Decision Making Under Uncertainty
* Stochastic Behavior (model variation on retraining)

---

## ⚙️ Tech Stack

**Backend**

* Python
* Flask
* scikit-learn
* pandas

**Frontend**

* HTML, CSS, JavaScript

**Visualization**

* Matplotlib
* Chart.js

---

## 📁 Project Structure

```
.
├── app.py
├── main.py
├── spam.csv
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   └── script.js
└── README.md
```

---

## 📊 Features

* 🔍 Spam/Ham classification using Naive Bayes
* 📈 Posterior probability display (Spam vs Ham)
* 🎯 Confidence estimation (high / medium / low)
* 🔁 Retrain option to demonstrate stochastic variation
* 🧩 Word-level contribution insights
* 📊 Dataset distribution visualization
* 🧪 Interactive message testing

---

## ⚙️ How It Works

1. Input message is converted to numerical form using **CountVectorizer**
2. Naive Bayes computes:

   * P(Spam | Message)
   * P(Ham | Message)
3. Model compares probabilities and selects the higher one
4. Output includes prediction + confidence

This directly applies **Bayes’ Theorem** for probabilistic inference.

---

## 📊 Model Performance

* Algorithm: Multinomial Naive Bayes
* Dataset: SMS Spam Collection
* Accuracy: ~97–99% (varies slightly due to randomness)

---

## 🔗 API Endpoints

### POST /predict

**Input**

```json
{
  "message": "Free money now"
}
```

**Output**

```json
{
  "prediction": "Spam",
  "prob_spam": 0.98,
  "prob_ham": 0.02
}
```

---

### POST /retrain

* Retrains model with random split
* Returns updated accuracy

---

## 🧪 Example Inputs

**Spam**

* "Congratulations! You won a free iPhone"
* "Earn money fast!!! Click now"

**Ham**

* "Are we meeting today?"
* "Send me the notes"

---

## 📸 Screenshots

*Add screenshots here for better visualization*

```
screenshots/home.png
screenshots/prediction.png
```

---

## ⚠️ Limitations

* Assumes independence between words (Naive assumption)
* Performance depends on dataset quality
* May misclassify ambiguous messages

---

## 🚀 Future Scope

* Deep learning models (LSTM, BERT)
* Real-time SMS/email filtering
* Deployment as web/mobile app
* Multilingual spam detection

---

## 💡 Why This Project Matters

Spam detection is widely used in:

* Email filtering systems
* Messaging platforms
* Cybersecurity

This project demonstrates how **probability theory is applied in real-world intelligent systems**.

---

## 🛠 Setup Instructions

```bash
git clone https://github.com/ishaan0509/SMS-Spam-Detection.git
cd SMS-Spam-Detection
pip install flask pandas scikit-learn matplotlib
python app.py
```

Then open:

```
http://127.0.0.1:5000/
```

---

## 📚 References

* UCI SMS Spam Dataset
* scikit-learn documentation
* Probability Theory (Bayes’ Theorem)

---

## 👨‍💻 Author

**Ishaan**
B.Tech EXTC (2nd Year)

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
