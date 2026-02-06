import React, { useState } from 'react';
import { ChevronDown, Edit2, Plus, Trash2, X } from 'lucide-react';
import { useBankStore } from '@/store/bankStore';
import { Button } from './Button';
import './QuestionBankSelector.css';

interface QuestionBankSelectorProps {
  value: string;
  onChange: (bankId: string) => void;
  onStartTest: () => void;
}

export const QuestionBankSelector: React.FC<QuestionBankSelectorProps> = ({
  value,
  onChange,
  onStartTest,
}) => {
  const { banks, getBanks, addBank, updateBank, deleteBank } = useBankStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankValue, setNewBankValue] = useState('');

  const bankOptions = getBanks();
  const selectedBank = bankOptions.find((b) => b.id === value);

  const handleEdit = (bankId: string) => {
    const bank = bankOptions.find((b) => b.id === bankId);
    if (bank) {
      setIsEditing(bankId);
      setEditingName(bank.name);
    }
  };

  const handleSaveEdit = (bankId: string) => {
    if (editingName.trim()) {
      updateBank(bankId, editingName.trim());
      setIsEditing(null);
      setEditingName('');
    }
  };

  const handleAddBank = () => {
    if (newBankName.trim() && newBankValue.trim()) {
      addBank(newBankName.trim(), newBankValue.trim());
      setNewBankName('');
      setNewBankValue('');
      setShowAddForm(false);
    }
  };

  const handleDeleteBank = (bankId: string) => {
    const bank = bankOptions.find((b) => b.id === bankId);
    if (bank && !bank.isCustom) {
      alert('無法刪除預設題庫');
      return;
    }
    if (confirm('確定要刪除此題庫選項嗎？')) {
      deleteBank(bankId);
      if (value === bankId) {
        // 如果刪除的是當前選中的，切換到第一個
        const remaining = getBanks();
        if (remaining.length > 0) {
          onChange(remaining[0].id);
        }
      }
    }
  };

  return (
    <div className="question-bank-selector">
      <div className="selector-wrapper">
        <div
          className="selector-dropdown"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="selector-label">
            {selectedBank ? selectedBank.name : '請選擇題庫'}
          </span>
          <ChevronDown
            size={20}
            className={`dropdown-icon ${isOpen ? 'open' : ''}`}
          />
        </div>

        {isOpen && (
          <div className="dropdown-menu">
            {bankOptions.map((bank) => (
              <div key={bank.id} className="dropdown-item-wrapper">
                {isEditing === bank.id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSaveEdit(bank.id)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(bank.id);
                        }
                      }}
                      autoFocus
                      className="edit-input"
                    />
                  </div>
                ) : (
                  <div
                    className={`dropdown-item ${value === bank.id ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(bank.id);
                      setIsOpen(false);
                    }}
                  >
                    <span>{bank.name}</span>
                    <div className="item-actions">
                      <button
                        className="icon-btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(bank.id);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      {bank.isCustom && (
                        <button
                          className="icon-btn-small icon-btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBank(bank.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {showAddForm ? (
              <div className="add-form">
                <input
                  type="text"
                  placeholder="題庫名稱"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="add-input"
                />
                <input
                  type="text"
                  placeholder="題庫代碼（英文）"
                  value={newBankValue}
                  onChange={(e) => setNewBankValue(e.target.value)}
                  className="add-input"
                />
                <div className="add-actions">
                  <Button size="sm" onClick={handleAddBank}>
                    確認
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewBankName('');
                      setNewBankValue('');
                    }}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className="add-bank-btn"
                onClick={() => setShowAddForm(true)}
              >
                <Plus size={16} />
                新增題庫選項
              </button>
            )}
          </div>
        )}
      </div>

      {selectedBank && (
        <Button
          variant="primary"
          size="lg"
          onClick={onStartTest}
          className="start-test-btn"
        >
          開始測驗
        </Button>
      )}
    </div>
  );
};

