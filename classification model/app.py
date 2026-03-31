from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import json
import os
import random

app = Flask(__name__)
CORS(app)

# Yoga pose classes
class_names = ['Downward Dog', 'Tree Pose', 'Warrior I', 'Warrior II', 'Child Pose']

@app.route('/')
def home():
    return jsonify({"message": "Yoga Pose Classification API is running!"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        keypoints = data.get('keypoints')
        
        if not keypoints or len(keypoints) != 51:
            return jsonify({"error": "Invalid keypoints data. Expected 51 values."}), 400
        
        # For demo purposes, return a random prediction
        # In production, this would use the actual trained model
        predicted_class = random.choice(class_names)
        confidence = random.uniform(0.7, 0.95)
        
        # Generate random probabilities for all classes
        predictions = {}
        remaining_confidence = 1.0 - confidence
        for class_name in class_names:
            if class_name == predicted_class:
                predictions[class_name] = confidence
            else:
                predictions[class_name] = remaining_confidence / (len(class_names) - 1)
        
        return jsonify({
            "predicted_pose": predicted_class,
            "confidence": confidence,
            "all_predictions": predictions
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": False,
        "message": "Demo mode - using mock predictions"
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
