export const poseFeedback = {
  Tree: {
    excellent: [
      "Perfect Tree Pose! Your balance is exceptional!",
      "Amazing stability! You're rooted like a strong tree.",
      "Excellent form! Your alignment is spot on.",
      "Wonderful! Your Tree Pose is strong and centered."
    ],
    good: [
      "Good Tree Pose! Try to keep your standing leg straighter.",
      "Nice work! Focus on keeping your hips level.",
      "Good balance! Engage your core more for stability.",
      "Well done! Try to lift your chest slightly more."
    ],
    improving: [
      "Keep working on your balance! Focus on a fixed point.",
      "Try to place your foot higher on the inner thigh.",
      "Work on keeping your arms lifted and shoulders relaxed.",
      "Focus on grounding through your standing foot."
    ],
    tips: [
      "Keep your gaze fixed on one point for better balance",
      "Press your foot firmly against your inner thigh",
      "Engage your core muscles for stability",
      "Keep your shoulders relaxed and away from your ears"
    ]
  },
  Chair: {
    excellent: [
      "Perfect Chair Pose! Your thighs are parallel to the floor!",
      "Excellent! Your form is strong and aligned.",
      "Amazing Chair Pose! Great depth and stability.",
      "Perfect! Your arms are lifted beautifully."
    ],
    good: [
      "Good Chair Pose! Try to sink a little deeper.",
      "Nice work! Keep your weight in your heels.",
      "Good form! Try to keep your chest more lifted.",
      "Well done! Engage your core more deeply."
    ],
    improving: [
      "Keep your knees bent more, like sitting in an invisible chair",
      "Try to keep your arms more parallel to the floor",
      "Work on keeping your spine more upright",
      "Focus on keeping your weight back in your heels"
    ],
    tips: [
      "Keep your thighs as parallel to the floor as possible",
      "Arms should be extended alongside your ears",
      "Weight should be back in your heels",
      "Keep your chest lifted and spine long"
    ]
  },
  Cobra: {
    excellent: [
      "Beautiful Cobra Pose! Perfect backbend!",
      "Excellent! Your spine extension is amazing.",
      "Perfect form! Your shoulders are properly aligned.",
      "Wonderful Cobra! Great heart opening."
    ],
    good: [
      "Good Cobra Pose! Try to lift higher using your back strength.",
      "Nice work! Keep your shoulders away from your ears.",
      "Good form! Press more firmly through your hands.",
      "Well done! Try to lengthen your spine more."
    ],
    improving: [
      "Use your back muscles more than your arms to lift",
      "Keep your elbows slightly bent and close to your body",
      "Press your pubic bone firmly into the floor",
      "Look slightly forward rather than cranking your neck back"
    ],
    tips: [
      "Use your back muscles, not just arm strength",
      "Keep shoulders away from ears",
      "Press through the tops of your feet",
      "Lengthen through the crown of your head"
    ]
  },
  Dog: {
    excellent: [
      "Perfect Downward Dog! Beautiful inverted V shape!",
      "Excellent! Your alignment is flawless.",
      "Amazing Dog Pose! Great extension through your spine.",
      "Perfect! Your heels are nicely grounded."
    ],
    good: [
      "Good Downward Dog! Try to press your heels toward the floor.",
      "Nice work! Keep your arms straight and strong.",
      "Good form! Lift your sitting bones higher.",
      "Well done! Press more firmly through your hands."
    ],
    improving: [
      "Try to create more of an inverted V shape",
      "Press your hands firmly into the mat",
      "Work on straightening your legs more",
      "Draw your shoulders away from your ears"
    ],
    tips: [
      "Create an inverted V shape with your body",
      "Press firmly through all four corners of your hands",
      "Keep your head between your upper arms",
      "Engage your core to support the pose"
    ]
  },
  Warrior: {
    excellent: [
      "Perfect Warrior Pose! Incredible strength and balance!",
      "Excellent! Your alignment is warrior-strong!",
      "Amazing! Your form is powerful and stable.",
      "Perfect Warrior! Great extension and focus."
    ],
    good: [
      "Good Warrior Pose! Keep your front knee at 90 degrees.",
      "Nice work! Square your hips more to the front.",
      "Good form! Extend your arms more actively.",
      "Well done! Keep your back leg straight and strong."
    ],
    improving: [
      "Bend your front knee to 90 degrees over your ankle",
      "Square your hips more toward the front of the mat",
      "Keep your back leg straight and active",
      "Reach strongly through both arms"
    ],
    tips: [
      "Front knee should be directly over the ankle",
      "Back leg should be straight and strong",
      "Hips should face forward",
      "Arms reach actively in opposite directions"
    ]
  },
  Traingle: {
    excellent: [
      "Perfect Triangle Pose! Beautiful extension!",
      "Excellent! Your alignment is precise.",
      "Amazing! Your form is open and expansive.",
      "Perfect Triangle! Great sideways stretch."
    ],
    good: [
      "Good Triangle! Try to keep both legs straight.",
      "Nice work! Open your chest more to the side.",
      "Good form! Reach further through your top arm.",
      "Well done! Keep your torso more extended."
    ],
    improving: [
      "Keep both legs straight and strong",
      "Reach actively through your top arm",
      "Keep your chest open to the side",
      "Avoid collapsing your bottom side"
    ],
    tips: [
      "Keep both legs straight and engaged",
      "Reach through your fingertips in both directions",
      "Keep your chest open and expanded",
      "Maintain a long, straight spine"
    ]
  },
  Shoulderstand: {
    excellent: [
      "Perfect Shoulderstand! Beautiful alignment!",
      "Excellent! Your form is steady and controlled.",
      "Amazing! Your alignment is vertical.",
      "Perfect! Great core engagement and control."
    ],
    good: [
      "Good Shoulderstand! Keep your body more vertical.",
      "Nice work! Support your back properly with your hands.",
      "Good form! Engage your core more.",
      "Well done! Keep your legs actively reaching up."
    ],
    improving: [
      "Work on keeping your body more vertical",
      "Support your lower back with your hands",
      "Keep your neck relaxed and straight",
      "Engage your core to support the inversion"
    ],
    tips: [
      "Keep your body as vertical as possible",
      "Support your back with your hands",
      "Keep your neck relaxed and aligned",
      "Engage your core muscles throughout"
    ]
  }
};

export const getPoseFeedback = (poseName, confidence, improvement) => {
  const feedback = poseFeedback[poseName];
  if (!feedback) return "Keep practicing your pose!";
  
  if (confidence > 0.95) {
    return feedback.excellent[Math.floor(Math.random() * feedback.excellent.length)];
  } else if (confidence > 0.85) {
    return feedback.good[Math.floor(Math.random() * feedback.good.length)];
  } else {
    return feedback.improving[Math.floor(Math.random() * feedback.improving.length)];
  }
};

export const getPoseTips = (poseName) => {
  const feedback = poseFeedback[poseName];
  if (!feedback) return "Focus on your breathing and alignment.";
  
  return feedback.tips[Math.floor(Math.random() * feedback.tips.length)];
};
