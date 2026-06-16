import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    // temporary client-side navigation for prototyping
    navigate('/student');
  }

  return (
    <div className="login-page">
      <main className="login-shell">
        <section className="login-brand-panel">
          <div className="brand-badge">Free Classroom Finder</div>
          <h1>Find the right room faster.</h1>
          <p>
            Track classrooms, manage timetables, and keep your school schedule
            organized in one place.
          </p>

          <div className="feature-list" aria-label="Platform highlights">
            <div className="feature-item">
              <span className="feature-icon">01</span>
              <div>
                <strong>Search classrooms</strong>
                <span>Filter rooms by capacity, building, and availability.</span>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">02</span>
              <div>
                <strong>Plan schedules</strong>
                <span>Keep timetables consistent across courses and groups.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card__header">
            <p className="eyebrow">Welcome back</p>
            <h2 id="login-title">Sign in to continue</h2>
            <p className="subtle-copy">
              Choose your role and access the dashboard for your workflow.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="role-toggle" role="tablist" aria-label="Login role">
              <button type="button" className="role-toggle__button is-active">
                Student
              </button>
              <button type="button" className="role-toggle__button">
                Admin
              </button>
            </div>

            <label className="field">
              <span>School email</span>
              <input type="email" name="email" placeholder="you@school.edu" />
            </label>

            <label className="field">
              <span>Password</span>
              <input type="password" name="password" placeholder="Enter your password" />
            </label>

            <div className="form-row">
              <label className="checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <a href="/" className="text-link">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="primary-button">
              Sign in
            </button>
          </form>

          <p className="footer-note">
            Need an account? Contact your school administrator to get access.
          </p>
        </section>
      </main>
    </div>
  );
}
