import React, { useState, useEffect } from 'react';

interface AllowedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: { id: string; name: string }[];
  selectedIds: string[];
  onSave: (selectedIds: string[]) => void;
}

export const AllowedItemsModal: React.FC<AllowedItemsModalProps> = ({
  isOpen,
  onClose,
  title,
  items,
  selectedIds,
  onSave,
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelected([...selectedIds]);
    }
  }, [isOpen, selectedIds]);

  const handleToggleItem = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(itemId => itemId !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto min-h-screen p-4">
      <div className="bg-theme-gradient rounded-lg w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-theme-modal flex justify-between items-center">
          <h2 className="text-xl font-bold text-theme-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-theme-primary hover:text-theme-danger"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-grow">
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`item-${item.id}`}
                  checked={selected.includes(item.id)}
                  onChange={() => handleToggleItem(item.id)}
                  className="mr-3 accent-purple-500 w-5 h-5 border border-theme rounded transition-all duration-150 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-theme-input shadow-sm"
                />
                <label htmlFor={`item-${item.id}`} className="text-theme-primary font-semibold">
                  {item.name}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-theme-modal flex justify-end">
          <button
            onClick={handleSave}
            className="header-action-btn px-4 py-2 font-roboto"
          >
            Update List
          </button>
        </div>
      </div>
    </div>
  );
}; 