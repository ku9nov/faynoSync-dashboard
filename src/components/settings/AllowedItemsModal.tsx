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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-theme-gradient rounded-lg w-1/2 max-h-3/4 flex flex-col overflow-hidden">
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
                  className="mr-3 h-4 w-4 text-theme-button-primary"
                />
                <label htmlFor={`item-${item.id}`} className="text-theme-primary">
                  {item.name}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-theme-modal flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-theme-button-primary text-theme-primary rounded-lg hover:bg-opacity-80"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}; 