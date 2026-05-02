import React from "react";

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Delete",
  cancelText = "Cancel"
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
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
