import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { poseImages } from '../../utils/pose_images'
import './DropDown.css'

export default function DropDown({ poseList, currentPose, setCurrentPose }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [dropdownRef])

    return (
        <div className='custom-dropdown' ref={dropdownRef}>
            <button 
                className={`dropdown-trigger glass-panel ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="trigger-content">
                    <span className="label">Select Pose</span>
                    <span className="value">{currentPose}</span>
                </div>
                <ChevronDown className={`chevron ${isOpen ? 'rotate' : ''}`} size={20} />
            </button>
            
            {isOpen && (
                <div className="dropdown-menu glass-panel animate-fade-in">
                    <ul className="dropdown-list">
                        {poseList.map((pose) => (
                            <li 
                                key={pose}
                                className={`dropdown-item ${currentPose === pose ? 'selected' : ''}`}
                                onClick={() => {
                                    setCurrentPose(pose)
                                    setIsOpen(false)
                                }}
                            >
                                <div className="item-info">
                                    <span className="item-name">{pose}</span>
                                    {currentPose === pose && <Check size={16} color="var(--success)" />}
                                </div>
                                <img 
                                    src={poseImages[pose]}
                                    className="dropdown-img"
                                    alt={`${pose} pose`}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}