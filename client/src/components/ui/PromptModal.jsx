import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

const PromptModal = ({ isOpen, onClose, onConfirm, title, message, placeholder = '', confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit}>
        <div className="text-gray-700 mb-4">
          {message}
        </div>
        <div className="mb-6">
          <Input 
            autoFocus
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button type="submit" variant="primary" disabled={!value.trim()}>
            {confirmText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PromptModal;
