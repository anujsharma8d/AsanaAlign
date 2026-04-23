import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import React, { useRef, useState, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Square, Timer, Trophy } from 'lucide-react'

import { count } from '../../utils/music'; 
import Instructions from '../../components/Instrctions/Instructions';
import DropDown from '../../components/DropDown/DropDown';
import { poseImages } from '../../utils/pose_images';
import { POINTS, keypointConnections, poseInstructions } from '../../utils/data';
import { drawPoint, drawSegment } from '../../utils/helper'
import api from '../../utils/api';

import './Yoga.css'

let skeletonColor = 'rgb(255,255,255)'
let poseList = [
  'Tree', 'Chair', 'Cobra', 'Warrior', 'Dog',
  'Shoulderstand', 'Traingle'
]

let interval

// flag variable is used to help capture the time when AI just detect 
// the pose as correct(probability more than threshold)
let flag = false

function Yoga() {
  const navigate = useNavigate()
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)

  const [startingTime, setStartingTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [poseTime, setPoseTime] = useState(0)
  const [bestPerform, setBestPerform] = useState(0)
  const [currentPose, setCurrentPose] = useState('Tree')
  const [isStartPose, setIsStartPose] = useState(false)

  useEffect(() => {
    const timeDiff = (currentTime - startingTime)/1000
    if(flag) {
      setPoseTime(Number(timeDiff.toFixed(1)))
    }
    if(timeDiff > bestPerform) {
      setBestPerform(Number(timeDiff.toFixed(1)))
    }
  }, [currentTime, bestPerform, startingTime])

  useEffect(() => {
    setCurrentTime(0)
    setPoseTime(0)
    setBestPerform(0)
  }, [currentPose])

  const CLASS_NO = {
    Chair: 0,
    Cobra: 1,
    Dog: 2,
    No_Pose: 3,
    Shoulderstand: 4,
    Traingle: 5,
    Tree: 6,
    Warrior: 7,
  }

  function get_center_point(landmarks, left_bodypart, right_bodypart) {
    let left = tf.gather(landmarks, left_bodypart, 1)
    let right = tf.gather(landmarks, right_bodypart, 1)
    const center = tf.add(tf.mul(left, 0.5), tf.mul(right, 0.5))
    return center
  }

  function get_pose_size(landmarks, torso_size_multiplier=2.5) {
    let hips_center = get_center_point(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP)
    let shoulders_center = get_center_point(landmarks,POINTS.LEFT_SHOULDER, POINTS.RIGHT_SHOULDER)
    let torso_size = tf.norm(tf.sub(shoulders_center, hips_center))
    let pose_center_new = get_center_point(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP)
    pose_center_new = tf.expandDims(pose_center_new, 1)

    pose_center_new = tf.broadcastTo(pose_center_new, [1, 17, 2])
    let d = tf.gather(tf.sub(landmarks, pose_center_new), 0, 0)
    let max_dist = tf.max(tf.norm(d,'euclidean', 0))

    let pose_size = tf.maximum(tf.mul(torso_size, torso_size_multiplier), max_dist)
    return pose_size
  }

  function normalize_pose_landmarks(landmarks) {
    let pose_center = get_center_point(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP)
    pose_center = tf.expandDims(pose_center, 1)
    pose_center = tf.broadcastTo(pose_center, [1, 17, 2])
    landmarks = tf.sub(landmarks, pose_center)

    let pose_size = get_pose_size(landmarks)
    landmarks = tf.div(landmarks, pose_size)
    return landmarks
  }

  function landmarks_to_embedding(landmarks) {
    landmarks = normalize_pose_landmarks(tf.expandDims(landmarks, 0))
    let embedding = tf.reshape(landmarks, [1,34])
    return embedding
  }

  const runMovenet = async () => {
    const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
    const poseClassifier = await tf.loadLayersModel('https://models.s3.jp-tok.cloud-object-storage.appdomain.cloud/model.json')
    const countAudio = new Audio(count)
    countAudio.loop = true
    interval = setInterval(() => { 
        detectPose(detector, poseClassifier, countAudio)
    }, 100)
  }

  const detectPose = async (detector, poseClassifier, countAudio) => {
    if (
      webcamRef.current &&
      webcamRef.current.video.readyState === 4
    ) {
      let notDetected = 0 
      const video = webcamRef.current.video
      const pose = await detector.estimatePoses(video)
      
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      try {
        const keypoints = pose[0].keypoints 
        let input = keypoints.map((keypoint) => {
          if(keypoint.score > 0.2) { // Lowered from 0.4
            if(!(keypoint.name === 'left_eye' || keypoint.name === 'right_eye')) {
              drawPoint(ctx, keypoint.x, keypoint.y, 6, skeletonColor)
              let connections = keypointConnections[keypoint.name]
              try {
                connections.forEach((connection) => {
                  let conName = connection.toUpperCase()
                  drawSegment(ctx, [keypoint.x, keypoint.y],
                      [keypoints[POINTS[conName]].x,
                       keypoints[POINTS[conName]].y]
                  , skeletonColor)
                })
              } catch(err) {}
            }
          } else {
            notDetected += 1
          } 
          return [keypoint.x, keypoint.y]
        }) 

        if(notDetected > 8) { // Increased from 4
          skeletonColor = 'rgb(255,255,255)'
          return
        }

        const processedInput = landmarks_to_embedding(input)
        const classification = poseClassifier.predict(processedInput)

        classification.array().then((data) => {         
          const classNo = CLASS_NO[currentPose]
          const confidence = data[0][classNo]
          
          // Debug logging to help identify why detection might fail
          if (confidence > 0.5) {
            console.log(`Pose: ${currentPose}, Confidence: ${confidence.toFixed(4)}`);
          }

          if(confidence > 0.90) { // Lowered from 0.97
            if(!flag) {
              countAudio.play()
              setStartingTime(Date.now())
              flag = true
            }
            setCurrentTime(Date.now()) 
            skeletonColor = 'rgb(0, 230, 118)' // var(--success)
          } else {
            flag = false
            skeletonColor = 'rgb(255,255,255)'
            countAudio.pause()
            countAudio.currentTime = 0
          }
        })
      } catch(err) {
        console.log(err)
      }
    }
  }

  function startYoga(){
    setIsStartPose(true) 
    runMovenet()
  } 

  const stopPose = async () => {
    setIsStartPose(false)
    clearInterval(interval)
    
    // Save session data
    const userData = JSON.parse(localStorage.getItem('yoga_user'));
    if (userData && userData.email && bestPerform > 0) {
      const sessionData = {
        email: userData.email,
        pose: currentPose,
        duration: Number(bestPerform),
        accuracy: 95,
        createdAt: new Date().toISOString()
      };

      // 1. Save to backend
      try {
        await api.saveSession(
          sessionData.email,
          sessionData.pose,
          sessionData.duration,
          sessionData.accuracy
        );
        console.log('Session saved to backend');
      } catch (error) {
        console.error('Error saving session to backend:', error);
      }

      // 2. Save to localStorage (Backup & for immediate Progress view)
      const localSessions = JSON.parse(localStorage.getItem('yoga_sessions') || '[]');
      localSessions.push(sessionData);
      localStorage.setItem('yoga_sessions', JSON.stringify(localSessions));
    }
    flag = false
  }

  const handleExit = async () => {
    await stopPose()
    navigate('/')
  }

  return (
    <div className="yoga-page animate-fade-in">
      <nav className="yoga-nav glass-panel">
        <div className="nav-back" onClick={handleExit} style={{ cursor: 'pointer' }}>
          <ArrowLeft size={20} />
          <span>Exit Session</span>
        </div>
        <div className="nav-logo">AsanaAlign</div>
        <div className="nav-actions">
           {isStartPose && (
             <div className="session-indicator">
               <span className="dot pulse"></span>
               Live Detection
             </div>
           )}
        </div>
      </nav>

      <main className="yoga-main">
        {!isStartPose ? (
          <div className="setup-container">
            <div className="setup-sidebar">
              <DropDown
                poseList={poseList}
                currentPose={currentPose}
                setCurrentPose={setCurrentPose}
              />
              <Instructions currentPose={currentPose} />
              <button onClick={startYoga} className="btn-primary btn-start">
                <Play size={20} fill="currentColor" />
                Start Session
              </button>
            </div>
            <div className="setup-preview glass-panel">
               <div className="preview-label">Preview Pose</div>
               <div className="preview-visual">
                  <img src={poseImages[currentPose]} alt={currentPose} className="setup-pose-img" />
               </div>
               <div className="preview-info">
                  <h2>{currentPose} Pose</h2>
                  <p>Position yourself so your full body is visible in the camera.</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="yoga-workspace">
            <div className="workspace-main">
              <div className="camera-container glass-panel">
                <Webcam
                  ref={webcamRef}
                  className="webcam-video"
                  audio={false}
                />
                <canvas
                  ref={canvasRef}
                  className="webcam-canvas"
                  width="640"
                  height="480"
                />
              </div>
              <button onClick={stopPose} className="btn-primary btn-stop workspace-stop-btn">
                <Square size={20} fill="currentColor" />
                Stop Session
              </button>
            </div>
            
            <div className="workspace-sidebar">
              <div className="dashboard-card glass-panel">
                <h3>Session Stats</h3>
                <div className="stats-grid">
                  <div className="stat-box">
                    <Timer size={24} color="var(--accent-primary)" />
                    <span className="stat-label">Pose Time</span>
                    <span className={`stat-value ${flag ? 'highlight' : ''}`}>{poseTime}s</span>
                  </div>
                  <div className="stat-box">
                    <Trophy size={24} color="#ffd700" />
                    <span className="stat-label">Best Hold</span>
                    <span className="stat-value">{bestPerform}s</span>
                  </div>
                </div>
              </div>

              <div className="mini-instructions glass-panel">
                 <h4>Current Pose</h4>
                 <div className="mini-pose-info">
                    <img src={poseImages[currentPose]} alt={currentPose} />
                    <span>{currentPose}</span>
                 </div>
                 <div className="mini-pose-details">
                    <ul>
                      {poseInstructions[currentPose].map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Yoga