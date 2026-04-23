import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Camera, Wrench } from 'lucide-react'

import './Tutorials.css'
import { tutorials, fixCamera } from '../../utils/data'

export default function Tutorials() {
    return (
        <div className="tutorials-container">
            <nav className="tutorials-nav glass-panel">
                <Link to="/" className="back-link">
                    <ArrowLeft size={24} />
                    <span>Back to Home</span>
                </Link>
                <h1 className="nav-title">Support Center</h1>
            </nav>

            <main className="tutorials-main animate-fade-in">
                <section className="tutorial-section">
                    <div className="section-header">
                        <BookOpen size={28} color="var(--accent-primary)" />
                        <h2 className="section-title">Basic Tutorials</h2>
                    </div>
                    <div className="cards-grid">
                        {tutorials.map((tutorial, index) => (
                            <div className="tutorial-card glass-panel" key={index}>
                                <div className="card-number">{index + 1}</div>
                                <p className="card-content">{tutorial}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="tutorial-section mt-12">
                    <div className="section-header">
                        <Camera size={28} color="var(--accent-secondary)" />
                        <h2 className="section-title">Camera Troubleshooting</h2>
                    </div>
                    <div className="cards-grid">
                        {fixCamera.map((points, index) => (
                            <div className="tutorial-card glass-panel warning-card" key={index}>
                                <div className="card-icon"><Wrench size={20} /></div>
                                <p className="card-content">{points}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}
