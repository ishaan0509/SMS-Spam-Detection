# 📩 Spam Detection using Probability (PSP Project)

A web-based spam detection system built using **Naive Bayes Classification**, demonstrating real-world application of **Probability and Stochastic Processes (PSP)**.

---

## 🚀 Project Overview

This project classifies text messages as **Spam** or **Ham (legitimate)** using probabilistic modeling. It applies **Bayes’ Theorem** to compute the likelihood of a message being spam based on its content.

The system is implemented with:

* 🧠 Machine Learning (Naive Bayes)
* 📊 Probability Theory (PSP concepts)
* 🌐 Web Interface (Flask + HTML/CSS/JS)

---

## 🧠 PSP Concepts Used

* Conditional Probability
* Bayes’ Theorem
* Prior & Posterior Probability
* Random Sampling (Train-Test Split)
* Decision Making Under Uncertainty

---

## ⚙️ Tech Stack

**Backend:**

* Python
* Flask
* scikit-learn
* pandas

**Frontend:**

* HTML
* CSS (Warm UI theme)
* JavaScript

**Visualization:**

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

* 🔍 Classifies messages as **Spam or Ham**
* 📈 Displays **probability scores**
* 📊 Shows dataset distribution (Spam vs Ham)
* 🧪 Interactive message testing
* 🎨 Clean UI with warm color theme

---

## ▶️ How to Run

### 1. Install dependencies

```
pip install flask pandas scikit-learn matplotlib
```

### 2. Run the app

```
python app.py
```

### 3. Open in browser

```
http://127.0.0.1:5000/
```

---

## 🧪 Example Inputs

**Spam:**

* "Congratulations! You won a free iPhone"
* "Earn money fast!!! Click now"

**Ham:**

* "Are we meeting today?"
* "Send me the notes"

---

## 📈 Sample Output

* Prediction: **SPAM / HAM**
* Probability:

  * Spam: 0.95
  * Ham: 0.05

---

## 🎯 Key Insight

> This project demonstrates how probabilistic models can be used to make decisions under uncertainty, a fundamental concept in stochastic processes.

---

## 📌 Future Improvements

* Add deep learning models (LSTM, BERT)
* Deploy online (Render / Vercel)
* Improve UI/UX
* Add multilingual spam detection

---

## 👨‍💻 Author

**Ishaan**
B.Tech EXTC (2nd Year)

---

## ⭐ If you like this project

Give it a star on GitHub!
