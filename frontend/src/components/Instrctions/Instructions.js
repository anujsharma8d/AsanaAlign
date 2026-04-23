import React, { useState } from 'react'
import { Info } from 'lucide-react'
import { poseInstructions } from '../../utils/data'
import { poseImages } from '../../utils/pose_images'

import './Instructions.css'

export default function Instructions({ currentPose }) {
    const [instructions] = useState(poseInstructions)

    return (
        <div className="instructions-card glass-panel animate-fade-in">
            <div className="instructions-header">
                <Info size={18} color="var(--accent-primary)" />
                <h3>How to perform {currentPose}</h3>
            </div>

            {/* Pose image — full width, no white background */}
            <div className="instructions-visual">
                <img
                    className="pose-demo-img"
                    src={poseImages[currentPose]}
                    alt={`${currentPose} demonstration`}
                />
                <div className="target-overlay">Target Pose</div>
            </div>

            {/* Steps stacked below */}
            <ul className="instructions-list">
                {instructions[currentPose].map((instruction, index) => (
                    <li key={index} className="instruction-item">
                        <span className="step-number">{index + 1}</span>
                        <p>{instruction}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}
