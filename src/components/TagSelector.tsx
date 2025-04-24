"use client";

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface Tag {
  id: string;
  name: string;
}

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tagIds: string[]) => void;
  availableTags: Tag[];
  onCreateTag?: (name: string) => Promise<Tag>;
}

export default function TagSelector({
  selectedTags,
  onChange,
  availableTags,
  onCreateTag
}: TagSelectorProps) {
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  
  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };
  
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTagName.trim() || !onCreateTag) return;
    
    try {
      setIsCreatingTag(true);
      const newTag = await onCreateTag(newTagName.trim());
      
      // Add the new tag to selected tags
      onChange([...selectedTags, newTag.id]);
      
      // Clear the input
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag. Please try again.');
    } finally {
      setIsCreatingTag(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Selected Tags</h3>
        <div className="flex flex-wrap gap-2">
          {selectedTags.length > 0 ? (
            selectedTags.map(tagId => {
              const tag = availableTags.find(t => t.id === tagId);
              return (
                <Badge
                  key={tagId}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag?.name || tagId}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleToggleTag(tagId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })
          ) : (
            <span className="text-muted-foreground text-sm">No tags selected</span>
          )}
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Available Tags</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {availableTags.length > 0 ? (
            availableTags
              .filter(tag => !selectedTags.includes(tag.id))
              .map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary"
                  onClick={() => handleToggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))
          ) : (
            <span className="text-muted-foreground text-sm">No available tags</span>
          )}
        </div>
      </div>
      
      {onCreateTag && (
        <div>
          <h3 className="text-sm font-medium mb-2">Create New Tag</h3>
          <form onSubmit={handleCreateTag} className="flex gap-2">
            <Input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter tag name"
              disabled={isCreatingTag}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!newTagName.trim() || isCreatingTag}
            >
              {isCreatingTag ? 'Creating...' : 'Create'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
} 