"use client";

import AdminProtected from './AdminProtected';
import { Button } from '@/components/ui/button';

interface BlogPostEditButtonProps {
  postId: string;
  isEditing?: boolean;
  onToggleEdit?: () => void;
}

export default function BlogPostEditButton({ 
  postId, 
  isEditing = false, 
  onToggleEdit
}: BlogPostEditButtonProps) {
  const handleEditClick = () => {
    if (onToggleEdit) {
      onToggleEdit();
    }
  };
  
  return (
    <AdminProtected>
      <Button 
        onClick={handleEditClick}
        variant="default"
        size="sm"
      >
        Edit
      </Button>
    </AdminProtected>
  );
} 