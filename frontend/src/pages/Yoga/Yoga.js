import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import { useRef, useState, useEffect } from 'react'
import Webcam from 'react-webcam'
import { useNavigate } from 'react-router-dom'
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
  'Chair', 'Warrior', 'Cobra', 'Dog', 'Tree', 'Traingle', 'Shoulderstand'
]

// Module-level vars (survive re-renders, safe inside setInterval closures)
let interval        = null
let flag            = false   // true while pose is correctly held
let sessionSaved    = false   // prevents double-save on stop + exit

function Yoga() {
  const navigate    = useNavigate()
  const webcamRef   = useRef(null)
  const canvasRef   = useRef(null)

  // Refs for values that must be current inside interval callbacks
  const startingTimeRef = useRef(0)
  const poseTimerRef    = useRef(null)
  const bestPerformRef  = useRef(0)

  const [poseTime,    setPoseTime]    = useState(0)
  const [bestPerform, setBestPerform] = useState(0)
  const [currentPose, setCurrentPose] = useState('Chair')
  const [isStartPose, setIsStartPose] = useState(false)

  // ── Pose timer ──────────────────────────────────────────────────────────
  const startPoseTimer = () => {
    if (poseTimerRef.current) return   // already ticking
    startingTimeRef.current = Date.now()
    poseTimerRef.current = setInterval(() => {
      const elapsed = Number(((Date.now() - startingTimeRef.current) / 1000).toFixed(1))
      setPoseTime(elapsed)
      if (elapsed > bestPerformRef.current) {
        bestPerformRef.current = elapsed
        setBestPerform(elapsed)
      }
    }, 100)
  }

  // Stop the interval but keep the last poseTime visible on screen
  const stopPoseTimer = () => {
    if (poseTimerRef.current) {
      clearInterval(poseTimerRef.current)
      poseTimerRef.current = null
    }
    // Do NOT reset poseTime — keep showing the last held value
  }

  // Full reset — only on pose change or new session start
  const resetTimers = () => {
    if (poseTimerRef.current) {
      clearInterval(poseTimerRef.current)
      poseTimerRef.current = null
    }
    setPoseTime(0)
  }

  // Reset stats when pose changes
  useEffect(() => {
    resetTimers()
    setBestPerform(0)
    bestPerformRef.current = 0
  }, [currentPose])

  // ── TF helpers ──────────────────────────────────────────────────────────
  const CLASS_NO = {
    Chair: 0, Cobra: 1, Dog: 2, No_Pose: 3,
    Shoulderstand: 4, Traingle: 5, Tree: 6, Warrior: 7,
  }

  function get_center_point(landmarks, left_bodypart, right_bodypart) {
    let left  = tf.gather(landmarks, left_bodypart,  1)
    let right = tf.gather(landmarks, right_bodypart, 1)
    return tf.add(tf.mul(left, 0.5), tf.mul(right, 0.5))
  }

  function get_pose_size(landmarks, torso_size_multiplier = 2.5) {
    let hips_center      = get_center_point(landmarks, POINTS.LEFT_HIP,      POINTS.RIGHT_HIP)
    let shoulders_center = get_center_point(landmarks, POINTS.LEFT_SHOULDER, POINTS.RIGHT_SHOULDER)
    let torso_size       = tf.norm(tf.sub(shoulders_center, hips_center))
    let pose_center_new  = tf.broadcastTo(tf.expandDims(get_center_point(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP), 1), [1, 17, 2])
    let d                = tf.gather(tf.sub(landmarks, pose_center_new), 0, 0)
    let max_dist         = tf.max(tf.norm(d, 'euclidean', 0))
    return tf.maximum(tf.mul(torso_size, torso_size_multiplier), max_dist)
  }

  function normalize_pose_landmarks(landmarks) {
    let pose_center = tf.broadcastTo(tf.expandDims(get_center_point(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP), 1), [1, 17, 2])
    landmarks = tf.sub(landmarks, pose_center)
    return tf.div(landmarks, get_pose_size(landmarks))
  }

  function landmarks_to_embedding(landmarks) {
    return tf.reshape(normalize_pose_landmarks(tf.expandDims(landmarks, 0)), [1, 34])
  }

  // ── Detection loop ──────────────────────────────────────────────────────
  const runMovenet = async () => {
    const detector       = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
    )
    const poseClassifier = await tf.loadLayersModel(
      'https://models.s3.jp-tok.cloud-object-storage.appdomain.cloud/model.json'
    )
    const countAudio = new Audio(count)
    countAudio.loop  = true

    interval = setInterval(() => {
      detectPose(detector, poseClassifier, countAudio)
    }, 100)
  }

  const detectPose = async (detector, poseClassifier, countAudio) => {
    if (!webcamRef.current || webcamRef.current.video.readyState !== 4) return

    const video = webcamRef.current.video
    const pose  = await detector.estimatePoses(video)

    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    try {
      const keypoints = pose[0].keypoints
      let notDetected = 0

      let input = keypoints.map((keypoint) => {
        if (keypoint.score > 0.5) {
          if (keypoint.name !== 'left_eye' && keypoint.name !== 'right_eye') {
            drawPoint(ctx, keypoint.x, keypoint.y, 6, skeletonColor)
            const connections = keypointConnections[keypoint.name]
            try {
              connections.forEach((connection) => {
                const conName = connection.toUpperCase()
                drawSegment(ctx,
                  [keypoint.x, keypoint.y],
                  [keypoints[POINTS[conName]].x, keypoints[POINTS[conName]].y],
                  skeletonColor
                )
              })
            } catch (err) {}
          }
        } else {
          notDetected++
        }
        return [keypoint.x, keypoint.y]
      })

      // Require at least 10 high-confidence keypoints — rejects empty/noisy frames
      if (notDetected > 7) {
        skeletonColor = 'rgb(255,255,255)'
        if (flag) { stopPoseTimer(); flag = false }
        return
      }

      // Also require the core body keypoints (shoulders + hips) to be visible
      const corePoints = [
        POINTS.LEFT_SHOULDER, POINTS.RIGHT_SHOULDER,
        POINTS.LEFT_HIP,      POINTS.RIGHT_HIP
      ]
      const coreVisible = corePoints.every(pt => keypoints[pt]?.score > 0.5)
      if (!coreVisible) {
        skeletonColor = 'rgb(255,255,255)'
        if (flag) { stopPoseTimer(); flag = false }
        return
      }

      const classification = poseClassifier.predict(landmarks_to_embedding(input))

      classification.array().then((data) => {
        const confidence = data[0][CLASS_NO[currentPose]]

        if (confidence > 0.97) {
          if (!flag) {
            countAudio.play()
            flag = true
          }
          startPoseTimer()                        // starts only if not already running
          skeletonColor = 'rgb(0, 230, 118)'
        } else {
          if (flag) {
            stopPoseTimer()                       // stop and reset pose time
            flag = false
          }
          skeletonColor = 'rgb(255,255,255)'
          countAudio.pause()
          countAudio.currentTime = 0
        }
      })
    } catch (err) {
      console.log(err)
    }
  }

  // ── Session controls ────────────────────────────────────────────────────
  function startYoga() {
    sessionSaved = false
    flag         = false
    bestPerformRef.current = 0
    setBestPerform(0)
    setPoseTime(0)
    resetTimers()
    setIsStartPose(true)
    runMovenet()
  }

  const stopPose = async () => {
    if (sessionSaved) return
    sessionSaved = true

    clearInterval(interval)
    interval = null
    resetTimers()
    flag = false
    setIsStartPose(false)

    const userData = JSON.parse(localStorage.getItem('yoga_user'))
    if (userData?.email && bestPerformRef.current > 0) {
      try {
        await api.saveSession(userData.email, currentPose, Math.round(bestPerformRef.current), 95)
        console.log('Session saved')
      } catch (err) {
        console.error('Error saving session:', err)
      }
    }
  }

  const handleExit = async () => {
    await stopPose()
    navigate('/')
  }

  // ── Render ───────────────────────────────────────────────────────────────
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
                <Webcam ref={webcamRef} className="webcam-video" audio={false} />
                <canvas ref={canvasRef} className="webcam-canvas" width="640" height="480" />
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
                    <span className={`stat-value ${poseTime > 0 ? 'highlight' : ''}`}>{poseTime}s</span>
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
