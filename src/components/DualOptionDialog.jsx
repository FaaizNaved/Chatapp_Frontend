import React from "react";

export default function DualOptionDialog({ 
  isOpen, 
  onClose, 
  onLeave, 
  onDelete, 
  title, 
  message
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="modal-content">
          <p>{message}</p>
          
          <div className="dialog-options">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                onLeave();
                onClose();
              }}
            >
              Leave Group
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              Delete Group
            </button>
          </div>
          
          <div className="dialog-cancel">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
