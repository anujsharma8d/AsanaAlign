import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { getPoseFeedback, getPoseTips } from '../../utils/poseFeedback';
import './Feedback.css';

export default function Feedback({ currentPose, confidence, isCorrect, isVisible }) {
  const [feedback, setFeedback] = useState('');
  const [tips, setTips] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (isVisible && currentPose) {
      const newFeedback = getPoseFeedback(currentPose, confidence);
      const newTips = getPoseTips(currentPose);
      setFeedback(newFeedback);
      setTips(newTips);
    }
  }, [currentPose, confidence, isVisible]);

  if (!isVisible) return null;

  const getStatusClass = () => {
    if (confidence > 0.95) return 'status-excellent';
    if (confidence > 0.85) return 'status-good';
    return 'status-improving';
  };

  const getProgressWidth = () => {
    return `${Math.min(Math.max(confidence * 100, 0), 100)}%`;
  };

  return (
    <div className={`feedback-widget glass-panel animate-fade-in ${getStatusClass()} ${isMinimized ? 'minimized' : ''}`}>
      <div className="feedback-header" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="header-title">
          {isCorrect ? (
            <><CheckCircle size={20} className="icon-success" /> <span>Great Form!</span></>
          ) : (
            <><AlertCircle size={20} className="icon-warning" /> <span>Keep Practicing</span></>
          )}
        </div>
        <button className="toggle-btn">
          {isMinimized ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      
      {!isMinimized && (
        <div className="feedback-body">
          <div className="confidence-meter">
            <div className="meter-label">
              <span>Accuracy</span>
              <span className="meter-value">{Math.round(confidence * 100)}%</span>
            </div>
            <div className="meter-bar-bg">
              <div className="meter-bar-fill" style={{ width: getProgressWidth() }}></div>
            </div>
          </div>

          <p className="feedback-message">{feedback}</p>
          
          {tips && (
            <div className="feedback-tips">
              <Lightbulb size={16} className="tip-icon" />
              <span>{tips}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
