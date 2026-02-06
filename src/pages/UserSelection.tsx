import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, User } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import './UserSelection.css';

export const UserSelection: React.FC = () => {
  const navigate = useNavigate();
  const { users, addUser, deleteUser, updateUserName, setCurrentUser } = useUserStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  const handleAddUser = () => {
    if (newUserName.trim()) {
      addUser(newUserName.trim());
      setNewUserName('');
      setShowAddForm(false);
    }
  };

  const handleEdit = (userId: string, currentName: string) => {
    setEditingId(userId);
    setEditingName(currentName);
  };

  const handleSaveEdit = (userId: string) => {
    if (editingName.trim()) {
      updateUserName(userId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleSelectUser = (userId: string) => {
    setCurrentUser(userId);
    navigate('/home');
  };

  return (
    <div className="user-selection">
      <motion.div
        className="user-selection-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="page-title">選擇使用者</h1>
        <p className="page-subtitle">選擇或新增使用者以開始練習</p>

        <div className="user-grid">
          {users.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className="user-card"
                onClick={() => handleSelectUser(user.id)}
              >
                <div className="user-card-content">
                  <div className="user-avatar">
                    <User size={32} />
                  </div>
                  {editingId === user.id ? (
                    <div className="user-edit-form">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleSaveEdit(user.id)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(user.id);
                          }
                        }}
                        autoFocus
                        className="user-name-input"
                      />
                    </div>
                  ) : (
                    <h3 className="user-name">{user.name}</h3>
                  )}
                  <div className="user-actions">
                    <button
                      className="icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(user.id, user.name);
                      }}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="icon-btn icon-btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`確定要刪除使用者「${user.name}」嗎？`)) {
                          deleteUser(user.id);
                        }
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {showAddForm ? (
            <Card className="user-card user-card-add">
              <div className="user-add-form">
                <input
                  type="text"
                  placeholder="輸入使用者名稱"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddUser();
                    }
                  }}
                  autoFocus
                  className="user-name-input"
                />
                <div className="user-add-actions">
                  <Button size="sm" onClick={handleAddUser}>
                    確認
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewUserName('');
                    }}
                  >
                    取消
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className="user-card user-card-add-btn"
                onClick={() => setShowAddForm(true)}
              >
                <Plus size={48} />
                <span>新增使用者</span>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

