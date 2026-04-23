// API utility for backend communication

const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000';

class API {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ==================== Auth API ====================

  // Register a new user
  async register(email, password, name) {
    try {
      const response = await fetch(`${this.baseURL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // ==================== OTP / Signup API ====================

  // Send OTP to email for signup verification
  async sendOtp(email, password, name) {
    try {
      const response = await fetch(`${this.baseURL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      return data;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  }

  // Verify OTP and create account
  async verifyOtp(email, otp) {
    try {
      const response = await fetch(`${this.baseURL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'OTP verification failed');
      return data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }

  // ==================== Profile API ====================

  // Get user profile
  async getProfile(email) {
    try {
      const response = await fetch(`${this.baseURL}/api/profile?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get profile');
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile (name)
  async updateProfile(email, updates) {
    try {
      const response = await fetch(`${this.baseURL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...updates }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profile');
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(email, currentPassword, newPassword) {
    try {
      const response = await fetch(`${this.baseURL}/api/profile/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change password');
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // ==================== Progress API ====================

  // Get user progress
  async getProgress(email) {
    try {
      const response = await fetch(`${this.baseURL}/api/progress?email=${encodeURIComponent(email)}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get progress');
      }

      return data;
    } catch (error) {
      console.error('Get progress error:', error);
      throw error;
    }
  }

  // Save a yoga session
  async saveSession(email, pose, duration, accuracy = 0) {
    try {
      const response = await fetch(`${this.baseURL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, pose, duration, accuracy }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save session');
      }

      return data;
    } catch (error) {
      console.error('Save session error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new API();