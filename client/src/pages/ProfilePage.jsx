import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { User, Mail, Phone, ShieldCheck, Calendar, Camera, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../api";
import { setCredentials } from "../app/store";

const ProfilePage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userInfo?.name || "");
  const [phone, setPhone] = useState(userInfo?.phone || "");
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-BD", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await api.patch("/auth/profile", { name, phone });
      dispatch(setCredentials(data));
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.patch("/auth/password", { currentPassword, newPassword });
      setSuccess("Password changed successfully!");
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not change password");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setLoading(true);
    setError("");
    try {
      const { data: uploadRes } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const { data: updatedUser } = await api.patch("/auth/profile", { avatar: uploadRes.url });
      dispatch(setCredentials(updatedUser));
      setSuccess("Avatar updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-shell">
      <div className="profile-container">
        {error && (
          <div className="profile-alert error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {success && (
          <div className="profile-alert success">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        <header className="profile-header card">
          <div className="profile-cover"></div>
          <div className="profile-header-content">
            <div className="profile-avatar-wrap">
              {userInfo?.avatar ? (
                <img src={userInfo.avatar} alt={userInfo.name} className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {userInfo?.name?.charAt(0) || "U"}
                </div>
              )}
              <button 
                className="avatar-edit-btn" 
                title="Change Avatar"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                hidden 
                accept="image/*"
              />
            </div>
            <div className="profile-title-block">
              <h1>{userInfo?.name}</h1>
              <p className="subtext">{userInfo?.isAdmin ? "Administrator" : "Valued Customer"}</p>
            </div>
            <div className="profile-badges">
              {userInfo?.isAdmin && (
                <span className="badge admin-badge">
                  <ShieldCheck size={14} /> Admin Account
                </span>
              )}
              <span className="badge status-badge">Active Account</span>
            </div>
          </div>
        </header>

        <section className="profile-details-grid">
          <div className="profile-info-card card">
            <div className="card-header-flex">
              <h3>Personal Information</h3>
              {!isEditing && (
                <button className="text-btn" onClick={() => setIsEditing(true)}>Edit Details</button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="info-list">
                <div className="info-item-row">
                  <div className="info-icon"><User size={18} /></div>
                  <div className="info-val">
                    <label>Full Name</label>
                    <p>{userInfo?.name}</p>
                  </div>
                </div>
                <div className="info-item-row">
                  <div className="info-icon"><Mail size={18} /></div>
                  <div className="info-val">
                    <label>Email Address</label>
                    <p>{userInfo?.email}</p>
                  </div>
                </div>
                <div className="info-item-row">
                  <div className="info-icon"><Phone size={18} /></div>
                  <div className="info-val">
                    <label>Phone Number</label>
                    <p>{userInfo?.phone || "Not provided"}</p>
                  </div>
                </div>
                <div className="info-item-row">
                  <div className="info-icon"><Calendar size={18} /></div>
                  <div className="info-val">
                    <label>Member Since</label>
                    <p>{formatDate(userInfo?.createdAt)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="profile-actions-aside">
            <div className="card stat-card">
              <h3>Security</h3>
              <p className="subtext" style={{ marginBottom: '1rem' }}>Manage your account security and password.</p>
              
              {isChangingPassword ? (
                <form onSubmit={handlePasswordUpdate} className="profile-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                  <div className="form-actions-stack">
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                    <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setIsChangingPassword(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setIsChangingPassword(true)}>
                  Change Password
                </button>
              )}
            </div>

            {!isEditing && (
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .profile-container {
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          gap: 1.5rem;
        }

        .profile-alert {
          padding: 1rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 500;
        }

        .profile-alert.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .profile-alert.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbfcce;
        }

        .card-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .text-btn {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .profile-form {
          display: grid;
          gap: 1.25rem;
        }

        .form-group {
          display: grid;
          gap: 0.4rem;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--bg);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .profile-header {
          padding: 0;
          overflow: hidden;
          position: relative;
        }

        .profile-cover {
          height: 160px;
          background: linear-gradient(135deg, var(--primary), var(--primary-strong));
          opacity: 0.15;
        }

        .profile-header-content {
          padding: 0 2rem 2rem;
          display: flex;
          align-items: flex-end;
          gap: 1.5rem;
          margin-top: -60px;
        }

        .profile-avatar-wrap {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 20px;
          background: #fff;
          padding: 4px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .profile-avatar, .profile-avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 16px;
          object-fit: cover;
        }

        .profile-avatar-placeholder {
          background: var(--surface-soft);
          display: grid;
          place-items: center;
          font-size: 3.5rem;
          font-weight: 700;
          color: var(--primary);
        }

        .avatar-edit-btn {
          position: absolute;
          bottom: -8px;
          right: -8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary);
          color: #fff;
          border: 3px solid #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          transition: transform 0.2s ease;
        }

        .avatar-edit-btn:hover {
          transform: scale(1.1);
        }

        .profile-title-block h1 {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .profile-badges {
          margin-left: auto;
          display: flex;
          gap: 0.75rem;
        }

        .badge {
          padding: 0.4rem 0.8rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .admin-badge {
          background: #eef2ff;
          color: var(--primary);
        }

        .status-badge {
          background: #dcfce7;
          color: #15803d;
        }

        .profile-details-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 1.5rem;
        }

        .info-list {
          display: grid;
          gap: 1.5rem;
        }

        .info-item-row {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .info-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--surface-soft);
          color: var(--muted);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .info-val label {
          display: block;
          font-size: 0.7rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
          margin-bottom: 0.2rem;
        }

        .info-val p {
          font-weight: 600;
          color: var(--ink);
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .profile-details-grid {
            grid-template-columns: 1fr;
          }
          .profile-header-content {
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin-top: -40px;
          }
          .profile-badges {
            margin-left: 0;
            margin-top: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
